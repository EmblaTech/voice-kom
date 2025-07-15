import { EventBus, SpeechEvents } from '../common/eventbus';
import { IntentResult, Entities, Action, IntentTypes, IVoiceActuator,isVoiceEntity, VoiceEntity, EntityValue } from '../types';
import * as chrono from 'chrono-node';

// Interface for processed entities with resolved DOM elements
export interface ProcessedEntities {
  rawentities: Entities;
  targetElement?: HTMLElement | undefined;
  targetElements?: HTMLElement[];
  groupElement?: HTMLElement | undefined;
  targetName?: string | undefined; // Normalized value for input actions
}

// Interface for element processing strategies
interface ElementProcessor {
  canProcess(intent: string, entities: Entities): boolean;
  process(entities: Entities): Partial<ProcessedEntities>;
}

// Interface for value normalizers
interface ValueNormalizer {
  canNormalize(element: HTMLElement, value: string): boolean;
  normalize(element: HTMLElement, value: string): string;
}

export class VoiceActuator implements IVoiceActuator {
  private actionMap!: Map<IntentTypes, Action>;
  private elementProcessors: ElementProcessor[] = [];
  private valueNormalizers: ValueNormalizer[] = [];
  
  constructor(private eventBus: EventBus) {
    this.initializeProcessors();
    this.initializeNormalizers();
    this.initializeActionMap();
  }

  private initializeProcessors(): void {
    // Register element processors in order of priority
    this.elementProcessors = [
      new GroupedTargetProcessor(this),
      new MultipleTargetProcessor(this),
      new SingleTargetProcessor(this)
    ];
  }

  private initializeNormalizers(): void {
    this.valueNormalizers = [
      new EmailNormalizer(),
      new DateNormalizer(),
      new TimeNormalizer(),
      new NumericNormalizer()
    ];
  }

  private initializeActionMap(): void {
    this.actionMap = new Map<IntentTypes, Action>();
    
    // Register actions using generalized handlers
    this.registerAction(IntentTypes.CLICK_ELEMENT, { execute: (entities) => this.executeElementAction(entities, 'click')});
    this.registerAction(IntentTypes.FILL_INPUT, { execute: (entities) => this.executeInputAction(entities)});
    this.registerAction(IntentTypes.SCROLL_TO_ELEMENT, { execute: (entities) => this.executeScrollToElementAction(entities)});
    this.registerAction(IntentTypes.SCROLL, { execute: (entities) => this.executeScrollAction(entities)});
    this.registerAction(IntentTypes.CHECK_CHECKBOX, { execute: (entities) => this.executeCheckboxAction(entities, true)});
    this.registerAction(IntentTypes.UNCHECK_CHECKBOX, { execute: (entities) => this.executeCheckboxAction(entities, false)});
    this.registerAction(IntentTypes.CHECK_ALL, { execute: (entities) => this.executeMultipleCheckboxAction(entities, true)});
    this.registerAction(IntentTypes.UNCHECK_ALL, { execute: (entities) => this.executeMultipleCheckboxAction(entities, false)});
    this.registerAction(IntentTypes.SELECT_RADIO_OR_DROPDOWN, { execute: (entities) => this.executeSelectionAction(entities)});
    this.registerAction(IntentTypes.OPEN_DROPDOWN, { execute: (entities) => this.executeOpenDropdownAction(entities)});
    this.registerAction(IntentTypes.GO_BACK, { execute: (entities) => this.executeGoBackAction(entities)});
  }
  
  private registerAction(intentName: IntentTypes, action: Action): void {
    this.actionMap.set(intentName, action);
  }

  private processEntities(intent: string, entities: Entities): ProcessedEntities {
    let processedEntities: ProcessedEntities =  {
        rawentities: { ...entities } // Create a shallow copy to avoid mutating the original input
      };
    
    // Apply element processors
    for (const processor of this.elementProcessors) {
      if (processor.canProcess(intent, entities)) {
        const processed = processor.process(entities);
        processedEntities = { ...processedEntities, ...processed };
        break; // Use first matching processor
      }
    }
    
    // Apply value normalization if needed
    if (entities.value && processedEntities.targetElement && intent === IntentTypes.FILL_INPUT) {
      for (const normalizer of this.valueNormalizers) {
        if (normalizer.canNormalize(processedEntities.targetElement, entities.value as string)) {
          processedEntities.rawentities.value = normalizer.normalize(processedEntities.targetElement, entities.value as string);
          break;
        }
      }
    }

    return processedEntities;
  }

  /**
   * Process an array of intents sequentially
   */
  public async performAction(intents: IntentResult[]): Promise<boolean> {
    if (!intents || intents.length === 0) {
      console.log('VoiceActuator: No intents provided');
      return false;
    }

    let allSuccessful = true;
    
    for (const intent of intents) {
      const success = await this.executeIntent(intent);
      if (!success) {
        allSuccessful = false;
      }
    }
    
    return allSuccessful;
  }

  private async executeIntent(intent: IntentResult): Promise<boolean> {
    const action = this.actionMap.get(intent.intent);
    
    if (!action) {
      console.log(`VoiceActuator: No action registered for intent '${intent.intent}'`);
      this.eventBus.emit(SpeechEvents.ACTION_PAUSED);
      return false;
    }
    
    const processedEntities = this.processEntities(intent.intent, intent.entities || {});
    const result = action.execute(processedEntities);
    
    if (result) {
      this.eventBus.emit(SpeechEvents.ACTION_PERFORMED, {
        intent: intent.intent,
        entities: intent.entities
      });
    } else {
      this.eventBus.emit(SpeechEvents.ACTION_PAUSED);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return result;
  }

  // Utility methods exposed for processors
public findElement(
  targetName: string,
  context?: HTMLElement
): { element: HTMLElement; score: number } | null {
  const selector = context
    ? context.querySelectorAll('[voice\\.name]')
    : document.querySelectorAll('[voice\\.name]');

  console.log(`VoiceActuator: Found ${selector.length} elements with voice.name attributes`);

  if (selector.length === 0) return null;

  const scoredElements = Array.from(selector)
    .filter(element => element instanceof HTMLElement)
    .map(element => ({
      element: element as HTMLElement,
      score: this.calculateMatchScore(
        element.getAttribute('voice.name')?.toLowerCase() || '',
        targetName.toLowerCase()
      ),
      voiceName: element.getAttribute('voice.name') || ''
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredElements.length > 0) {
    const bestMatch = scoredElements[0];
    console.log(`VoiceActuator: Selected best match "${bestMatch.voiceName}" with score ${bestMatch.score}`);
    return { element: bestMatch.element, score: bestMatch.score };
  }

  return null;
}

public findFinalTarget(entity: VoiceEntity, context?: HTMLElement): HTMLElement | undefined {
    const candidates = [entity.english, entity.user_language];
    const bestResult = candidates
        .map(candidate => this.findElement(candidate, context))
        .filter(result => result !== null)
        .reduce((best, current) => 
          current && current.score > best.score ? current : best
        );
    console.log(`VoiceActuator: Best match for "${entity.english}" is "${bestResult?.element.getAttribute('voice.name')}" with score ${bestResult?.score}`);
    return bestResult?.element || undefined;
}

  public findElementsInGroup(groupName: string): HTMLElement[] {
    return Array.from(document.querySelectorAll(`[name="${groupName}"]`));
  }

  public calculateMatchScore(voiceName: string, targetName: string): number {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  
    const voiceTokens = normalize(voiceName);
    const targetTokens = normalize(targetName);
    
    if (voiceTokens.length === 0 || targetTokens.length === 0) return 0;
    
    let score = 0;
    
    if (voiceName === targetName) score += 100;
    if (voiceName.includes(targetName)) score += 50;
    else if (targetName.includes(voiceName)) score += 40;
    
    const matchingTokens = voiceTokens.filter(token => targetTokens.includes(token));
    score += matchingTokens.length * 10;
    score += (matchingTokens.length / voiceTokens.length) * 30;
    score += (matchingTokens.length / targetTokens.length) * 30;
    
    if (voiceTokens[0] === targetTokens[0]) score += 15;
    score += this.getLevenshteinSimilarity(voiceName, targetName) * 25;
    
    return score;
  }
  
  private getLevenshteinSimilarity(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator,
        );
      }
    }
    
    const distance = track[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? 1 - (distance / maxLength) : 1;
  }

  /* GENERALIZED ACTION EXECUTORS */

  private executeElementAction(entities: ProcessedEntities, actionType: string): boolean {
    if (!entities.rawentities.target || !entities.targetElement) {
      console.log(`VoiceActuator: No valid target for ${actionType} action`);
      return false;
    }

    switch (actionType) {
      case 'click':
        entities.targetElement.click();
        console.log(`VoiceActuator: Clicked element:`, entities.targetElement);
        break;
      case 'scroll':
        entities.targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log(`VoiceActuator: Scrolled to element:`, entities.targetElement);
        break;
    }
    return true;
  }

  private executeInputAction(entities: ProcessedEntities): boolean {
    if (!entities.rawentities.value || !entities.targetElement) {
      console.log('VoiceActuator: Missing required parameters for input action');
      return false;
    }
  
    if (entities.targetElement instanceof HTMLInputElement || 
        entities.targetElement instanceof HTMLTextAreaElement) {
      entities.targetElement.value = entities.rawentities.value as string;
      entities.targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      entities.targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`VoiceActuator: Filled input "${entities.rawentities.target}" with value "${entities.rawentities.value as string}"`);
      return true;
    }
    
    console.log(`VoiceActuator: Target element is not an input or textarea`);
    return false;
  }

  private executeCheckboxAction(entities: ProcessedEntities, check: boolean): boolean {
    if (!entities.rawentities.target || !entities.targetElement) {
      console.log(`VoiceActuator: No valid target for checkbox action`);
      return false;
    }
    
    if (entities.targetElement instanceof HTMLInputElement && entities.targetElement.type === 'checkbox') {
      if (entities.targetElement.checked !== check) {
        entities.targetElement.checked = check;
        entities.targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
      console.log(`VoiceActuator: ${check ? 'Checked' : 'Unchecked'} checkbox "${entities.rawentities.target}"`);
      return true;
    }
    
    console.log(`VoiceActuator: Target element is not a checkbox`);
    return false;
  }

  private executeMultipleCheckboxAction(entities: ProcessedEntities, check: boolean): boolean {
    if (!entities.targetElements || entities.targetElements.length === 0) {
      console.log(`VoiceActuator: No targets for multiple checkbox action`);
      return false;
    }
    
    let success = false;
    for (const element of entities.targetElements) {
      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        if (element.checked !== check) {
          element.checked = check;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        success = true;
      }
    }
    
    return success;
  }

  private executeSelectionAction(entities: ProcessedEntities): boolean {
    if (!entities.targetElement) {
      console.log(`entities.targetElement: ${entities.targetElement}`);
      console.log(`VoiceActuator: No valid target for selection action`);
      return false;
    }else if (!entities.targetName) {
      console.log(`VoiceActuator: No valid option for selection action`);
      return false;
    }

    // Handle dropdown
    if (entities.groupElement instanceof HTMLSelectElement ) {
      return this.selectInDropdown(entities.groupElement, entities.targetName);
    }
    
    // Handle radio button
    if (entities.targetElement instanceof HTMLInputElement && entities.targetElement.type === 'radio') {
      if (!entities.targetElement.checked) {
        entities.targetElement.checked = true;
        entities.targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
      console.log(`VoiceActuator: Selected radio button "${entities.targetName}"`);
      return true;
    }

    console.log(`VoiceActuator: Invalid selection context`);
    return false;
  }

  private executeOpenDropdownAction(entities: ProcessedEntities): boolean {
    if (!entities.rawentities.target || !entities.targetElement) {
      console.log('VoiceActuator: No valid target for open dropdown action');
      return false;
    }

    const element = entities.targetElement;

    // Handle native select
    if (element instanceof HTMLSelectElement) {
      element.focus();
      element.click();
      // Force open with size attribute
      element.size = element.options.length;
      setTimeout(() => element.size = 1, 5000);
      return true;
    }

    // Handle custom dropdowns - look for trigger within element
    const trigger = element.querySelector('[aria-expanded], button, [role="button"]') || element;
    
    (trigger as HTMLElement).focus();
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    console.log(`VoiceActuator: Opened dropdown "${entities.rawentities.target}"`);
    return true;
  }

  private selectInDropdown(selectElement: HTMLSelectElement, targetName: string): boolean {
    const options = Array.from(selectElement.options);
    const targetLower = targetName.toLowerCase();
    
    for (const option of options) {
      const optionText = option.textContent?.toLowerCase() || '';
      const optionValue = option.value.toLowerCase();
      
      if (optionText === targetLower || 
          optionValue === targetLower || 
          optionText.includes(targetLower) || 
          this.calculateMatchScore(optionText, targetLower) > 50) {
        
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`VoiceActuator: Selected dropdown option "${option.textContent}"`);
        return true;
      }
    }
    
    console.log(`VoiceActuator: No matching option found for "${targetName}"`);
    return false;
  }
  private executeScrollAction(entities: ProcessedEntities): boolean {
  if (!entities.rawentities.direction) {
    console.log('VoiceActuator: Missing direction parameter for scroll action');
    return false;
  }

  const scrollAmount = 300; // pixels to scroll
  const direction = (isVoiceEntity(entities.rawentities.direction) 
    ? entities.rawentities.direction.english
    : entities.rawentities.direction).toLowerCase();

  try {
    switch (direction) {
      case 'up':
        window.scrollBy(0, -scrollAmount);
        break;
      case 'down':
        window.scrollBy(0, scrollAmount);
        break;
      case 'left':
        window.scrollBy(-scrollAmount, 0);
        break;
      case 'right':
        window.scrollBy(scrollAmount, 0);
        break;
      case 'top':
        window.scrollTo(0, 0);
        break;
      case 'bottom':
        window.scrollTo(0, document.body.scrollHeight);
        break;
      default:
        console.log(`VoiceActuator: Unknown scroll direction "${direction}"`);
        return false;
    }

    console.log(`VoiceActuator: Scrolled ${direction}`);
    return true;
  } catch (error) {
    console.log(`VoiceActuator: Error during scroll action: ${error}`);
    return false;
  }
}

private executeScrollToElementAction(entities: ProcessedEntities): boolean {
  if (!entities.rawentities.target || !entities.targetElement) {
    console.log('VoiceActuator: Missing target parameter for scroll to element action');
    return false;
  }

  try {
    // Check if element is already in view
    const rect = entities.targetElement.getBoundingClientRect();
    const isInView = rect.top >= 0 && 
                     rect.left >= 0 && 
                     rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && 
                     rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    if (isInView) {
      // Element is already in view - focus and click it
      if (entities.targetElement instanceof HTMLElement) {
        // Focus the element if it's focusable
        if (entities.targetElement.tabIndex >= 0 || 
            entities.targetElement instanceof HTMLInputElement ||
            entities.targetElement instanceof HTMLTextAreaElement ||
            entities.targetElement instanceof HTMLSelectElement ||
            entities.targetElement instanceof HTMLButtonElement ||
            entities.targetElement instanceof HTMLAnchorElement) {
          entities.targetElement.focus();
        }
        
        // Click the element
        entities.targetElement.click();
        console.log(`VoiceActuator: Element "${entities.rawentities.target}" was in view - focused and clicked`);
      }
    } else {
      // Element not in view - scroll to it
      entities.targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      // Focus the element if it's focusable
      if (entities.targetElement instanceof HTMLElement && 
          (entities.targetElement.tabIndex >= 0 || 
           entities.targetElement instanceof HTMLInputElement ||
           entities.targetElement instanceof HTMLTextAreaElement ||
           entities.targetElement instanceof HTMLSelectElement ||
           entities.targetElement instanceof HTMLButtonElement ||
           entities.targetElement instanceof HTMLAnchorElement)) {
        entities.targetElement.focus();
      }

      console.log(`VoiceActuator: Scrolled to and focused element "${entities.rawentities.target}"`);
    }

    return true;
  } catch (error) {
    console.log(`VoiceActuator: Error processing element "${entities.rawentities.target}": ${error}`);
    return false;
  }
}

private executeGoBackAction(entities: ProcessedEntities): boolean {
  try {
    window.history.back();
    console.log('VoiceActuator: Navigated back to previous page');
    return true;
  } catch (error) {
    console.log(`VoiceActuator: Error going back: ${error}`);
    return false;
  }
}

}

/* ELEMENT PROCESSORS */
class SingleTargetProcessor implements ElementProcessor {
  constructor(private actuator: VoiceActuator) {}

  canProcess(intent: string, entities: Entities): boolean {
    return !!entities.target && !entities.group && !entities.targetGroup;
  }

  process(entities: Entities): Partial<ProcessedEntities> {
    const targetElement = isVoiceEntity(entities.target!) ? this.actuator.findFinalTarget(entities.target!) : undefined;
    return { targetElement };
  }
}

class MultipleTargetProcessor implements ElementProcessor {
  constructor(private actuator: VoiceActuator) {}

  canProcess(intent: string, entities: Entities): boolean {
    return !!entities.targetGroup;
  }

  process(entities: Entities): Partial<ProcessedEntities> {
    const groupElement = isVoiceEntity(entities.targetGroup!) ? this.actuator.findFinalTarget(entities.targetGroup!) : undefined;
    if (!groupElement) {
      console.log(`Processor: Could not find a group element matching "${entities.targetGroup}".`);
      return { targetElements: [] };
    }
    const targetElements = Array.from(
      groupElement.querySelectorAll('[voice\\.name]')
        ).filter(
          (element): element is HTMLElement => element instanceof HTMLElement
        );

    if (targetElements.length === 0) {
        console.warn(`Processor: Found the group "${entities.targetGroup}", but it contains no elements with a 'voice.name' attribute.`);
    }

    return { targetElements };
  }
}

class GroupedTargetProcessor implements ElementProcessor {
  constructor(private actuator: VoiceActuator) {}

  canProcess(intent: string, entities: Entities): boolean {
    return !!entities.target && (!!entities.group || this.shouldAutoDetectGroup(intent, entities));
  }

  process(entities: Entities): Partial<ProcessedEntities> {
    let groupElement: HTMLElement | undefined = undefined;
    let targetElement: HTMLElement | undefined = undefined;
    let targetName: string | undefined = undefined;

    // if mentioned group exists
    if (entities.group) {
      groupElement = isVoiceEntity(entities.group) ? this.actuator.findFinalTarget(entities.group) : undefined;     
      if (!groupElement) {
        console.log(`VoiceActuator: No matching group element found for group "${entities.group}"`);
        return { groupElement: undefined, targetElement: undefined };
      }

    } else {
      //no but if just a single group exists
      groupElement = this.detectSingleGroup();
      if (!groupElement) {
        console.log('VoiceActuator: Could not auto-detect unique group');
        return { targetElement: isVoiceEntity(entities.target!) ? this.actuator.findFinalTarget(entities.target!) : undefined };
      }
    }

    // Find target within group
    if (groupElement && entities.target) {
        const targetString = isVoiceEntity(entities.target!) ? entities.target.user_language : '';

        // For dropdown, the target is an option, but we return the select as targetElement
        const foundItem = isVoiceEntity(entities.target!) ? this.actuator.findFinalTarget(entities.target, groupElement) : undefined;
        if (!foundItem) {
          console.log(`VoiceActuator: Target "${targetString}" not found in dropdown`);
          return { groupElement, targetElement: undefined };
        }
        
        if (groupElement instanceof HTMLSelectElement) {
          targetElement = groupElement;
          targetName = foundItem.getAttribute('voice.name') || foundItem.textContent || '';
          console.log(`VoiceActuator: Found option for "${targetString}" in dropdown.`);
        } else {
          targetName = foundItem.getAttribute('voice.name') || foundItem.textContent || '';
          targetElement = foundItem;
          console.log(`VoiceActuator: Found radio button for "${targetString}".`);
      }
    }
    return { groupElement, targetElement, targetName };
  }


  private shouldAutoDetectGroup(intent: string, entities: Entities): boolean {
    return intent === IntentTypes.SELECT_RADIO_OR_DROPDOWN;
  }

  private detectSingleGroup(): HTMLElement | undefined {
    const dropdowns = document.querySelectorAll('select[voice\\.name]');
    const radioGroups = this.getUniqueRadioGroups();
    
    if (dropdowns.length === 1 && radioGroups.length === 0) {
      return dropdowns[0] as HTMLElement;
    } else if (dropdowns.length === 0 && radioGroups.length === 1) {
      // Return first radio button of the group as representative
      const firstRadio = document.querySelector(`input[type="radio"][name="${radioGroups[0]}"]`);
      return firstRadio as HTMLElement;
    }
    
    return undefined;
  }

  private getUniqueRadioGroups(): string[] {
    const radioButtons = document.querySelectorAll('input[type="radio"][voice\\.name]');
    const groups = new Set<string>();
    
    radioButtons.forEach(radio => {
      const name = (radio as HTMLInputElement).name;
      if (name) groups.add(name);
    });
    
    return Array.from(groups);
  }

  // private findTargetInDropdown(selectElement: HTMLSelectElement, targetName: EntityValue): HTMLElement | null {
  //   const options = Array.from(selectElement.options);
  //   const targetLower = targetName.toLowerCase();
    
  //   for (const option of options) {
  //     const optionText = option.textContent?.toLowerCase() || '';
  //     const optionValue = option.value.toLowerCase();
      
  //     if (optionText === targetLower || 
  //         optionValue === targetLower || 
  //         optionText.includes(targetLower) || 
  //         this.actuator.calculateMatchScore(optionText, targetLower) > 50) {
  //       return option as HTMLElement;
  //     }
  //   }
    
  //   return null;
  // }

  // private findTargetInRadioGroup(groupElement: HTMLElement, targetName: EntityValue): HTMLElement | null {
  //   console.log(`VoiceActuator: Checking radio button"`);

  //   const groupName = groupElement.getAttribute('name') || ''; 
  //   const radioButtons = document.querySelectorAll(`input[type="radio"][name="${groupName}"][value]`);
  //   console.log(`VoiceActuator: Found ${radioButtons.length} radio buttons in group "${groupName}"`);
  //   let bestMatch: HTMLElement | null = null;
  //   let bestScore = 0;
    
  //   for (const radio of radioButtons) {
  //     const voiceName = radio.getAttribute('value')?.toLowerCase() || '';
  //     console.log(`VoiceActuator: Checking radio button with voice name "${voiceName}"`);
  //     const score = this.actuator.calculateMatchScore(voiceName, targetName.toLowerCase());
      
  //     if (score > bestScore && score > 50) {
  //       bestScore = score;
  //       bestMatch = radio as HTMLElement;
  //     }
  //   }
    
  //   return bestMatch;
  // }
}

/* VALUE NORMALIZERS */

class EmailNormalizer implements ValueNormalizer {
  canNormalize(element: HTMLElement, value: string): boolean {
    return element instanceof HTMLInputElement && element.type === 'email';
  }

  normalize(element: HTMLElement, value: string): string {
    return value
      .replace(/\bat\b/gi, '@')
      .replace(/\bdot\b/gi, '.')
      .replace(/\bunderscore\b/gi, '_')
      .replace(/\bdash\b/gi, '-')
      .replace(/\bplus\b/gi, '+')
      .replace(/\s+/g, '')
      .trim();
  }
}

class NumericNormalizer implements ValueNormalizer {
  canNormalize(element: HTMLElement, value: string): boolean {
    return element instanceof HTMLInputElement && element.type === 'number';
  }

  normalize(element: HTMLElement, value: string): string {
    try {
      // Remove commas and connecting words
      const cleanValue = value
        .replace(/,/g, '') // Remove commas
        .replace(/\band\b/gi, '') // Remove 'and'
        .replace(/\s+/g, ''); // Remove extra spaces

      // Extract the first floating point number from the string
      const match = cleanValue.match(/-?\d+(?:\.\d+)?/);
      
      if (match) {
        return parseFloat(match[0]).toString();
      }
      
      return value; // Return original if no number found
    } catch (error) {
      console.error('Error normalizing numeric value:', error);
      return value;
    }
  }
}

class DateNormalizer implements ValueNormalizer {
  canNormalize(element: HTMLElement, value: string): boolean {
    return element instanceof HTMLInputElement && element.type === 'date';
  }

  normalize(element: HTMLElement, value: string): string {
    try {
      const lowerSpoken = value.toLowerCase();
      
      if (lowerSpoken === 'today' || lowerSpoken === 'now') {
        return new Date().toISOString().split('T')[0];
      }
      
      if (lowerSpoken === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      
      if (lowerSpoken === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
      
      const results = chrono.parse(value);
      if (results.length > 0) {
        const formattedDate = results[0].start.date().toISOString().split('T')[0];
        
        // Validate against min/max if available
        if (element instanceof HTMLInputElement) {
          const { min, max } = element;
          if (min && formattedDate < min) return min;
          if (max && formattedDate > max) return max;
        }
        
        return formattedDate;
      }
      
      return value;
    } catch (error) {
      console.error('Error normalizing date value:', error);
      return value;
    }
  }
}

class TimeNormalizer implements ValueNormalizer {
  canNormalize(element: HTMLElement, value: string): boolean {
    return element instanceof HTMLInputElement && element.type === 'time';
  }

  normalize(element: HTMLElement, value: string): string {
    try {
      const lowerSpoken = value.toLowerCase();
      
      if (lowerSpoken === 'now') {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
      
      const results = chrono.parse(value);
      if (results.length > 0) {
        const parsedTime = results[0].start.date();
        const formattedTime = `${String(parsedTime.getHours()).padStart(2, '0')}:${String(parsedTime.getMinutes()).padStart(2, '0')}`;
        
        // Validate against min/max if available
        if (element instanceof HTMLInputElement) {
          const { min, max } = element;
          if (min && formattedTime < min) return min;
          if (max && formattedTime > max) return max;
        }
        
        return formattedTime;
      }
      
      return value;
    } catch (error) {
      console.error('Error normalizing time value:', error);
      return value;
    }
  }
}