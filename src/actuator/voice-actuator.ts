import { IntentResult, Entities, Action, IntentTypes } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';
import * as chrono from 'chrono-node';

// Interface for processed entities with resolved DOM elements
interface ProcessedEntities extends Entities {
  targetElement?: HTMLElement | null;
  targetElements?: HTMLElement[];
  groupElement?: HTMLElement | null;
}

interface ElementProcessor {
  canProcess(intent: string, entities: Entities): boolean;
  process(entities: Entities): Partial<ProcessedEntities>;
}

interface ValueNormalizer {
  canNormalize(element: HTMLElement, value: string): boolean;
  normalize(element: HTMLElement, value: string): string;
}

export class VoiceActuator {
  private actionMap: Map<IntentTypes, Action> = new Map();
  private elementProcessors: ElementProcessor[] = [];
  private valueNormalizers: ValueNormalizer[] = [];

  constructor(private readonly eventBus: EventBus) {
    this.initializeProcessors();
    this.initializeNormalizers();
    this.initializeActionMap();
  }

  private initializeProcessors(): void {
    this.elementProcessors = [
      new GroupedTargetProcessor(this),
      new MultipleTargetProcessor(),
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
    this.registerAction(IntentTypes.CLICK_ELEMENT, { execute: (entities) => this.executeElementAction(entities, 'click') });
    this.registerAction(IntentTypes.FILL_INPUT, { execute: (entities) => this.executeInputAction(entities) });
    this.registerAction(IntentTypes.SCROLL_TO_ELEMENT, { execute: (entities) => this.executeScrollToElementAction(entities) });
    this.registerAction(IntentTypes.SCROLL, { execute: (entities) => this.executeScrollAction(entities) });
    this.registerAction(IntentTypes.CHECK_CHECKBOX, { execute: (entities) => this.executeCheckboxAction(entities, true) });
    this.registerAction(IntentTypes.UNCHECK_CHECKBOX, { execute: (entities) => this.executeCheckboxAction(entities, false) });
    this.registerAction(IntentTypes.CHECK_ALL, { execute: (entities) => this.executeMultipleCheckboxAction(entities, true) });
    this.registerAction(IntentTypes.UNCHECK_ALL, { execute: (entities) => this.executeMultipleCheckboxAction(entities, false) });
    this.registerAction(IntentTypes.SELECT_RADIO_OR_DROPDOWN, { execute: (entities) => this.executeSelectionAction(entities) });
    this.registerAction(IntentTypes.OPEN_DROPDOWN, { execute: (entities) => this.executeOpenDropdownAction(entities) });
    this.registerAction(IntentTypes.GO_BACK, { execute: (entities) => this.executeGoBackAction(entities) });
    this.registerAction(IntentTypes.TYPE_TEXT, { execute: (entities) => this.executeInputAction(entities) });

  }

  private registerAction(intentName: IntentTypes, action: Action): void {
    this.actionMap.set(intentName, action);
  }

  private processEntities(intent: string, entities: Entities): ProcessedEntities {
    let processedEntities: ProcessedEntities = { ...entities };
    for (const processor of this.elementProcessors) {
      if (processor.canProcess(intent, entities)) {
        const processed = processor.process(entities);
        processedEntities = { ...processedEntities, ...processed };
        break;
      }
    }
    if (entities.value && processedEntities.targetElement && intent === IntentTypes.FILL_INPUT) {
      for (const normalizer of this.valueNormalizers) {
        if (normalizer.canNormalize(processedEntities.targetElement, entities.value)) {
          processedEntities.value = normalizer.normalize(processedEntities.targetElement, entities.value);
          break;
        }
      }
    }
    return processedEntities;
  }



  public async performAction(intents: IntentResult[]): Promise<boolean> {
    console.log("*** voice-actuator.ts performAction() intents: ", intents);
    if (!intents || intents.length === 0) {
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

  public findElement(targetName: string, context?: HTMLElement): HTMLElement | null {
    const selector = context ?
      context.querySelectorAll('[voice\\.name]') :
      document.querySelectorAll('[voice\\.name]');
    if (selector.length === 0) return null;
    const scoredElements = Array.from(selector)
      .filter(element => element instanceof HTMLElement)
      .map(element => ({
        element: element as HTMLElement,
        score: this.calculateMatchScore(
          element.getAttribute('voice.name') || '',
          targetName.toLowerCase()
        ),
        voiceName: element.getAttribute('voice.name') || ''
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scoredElements.length > 0) {
      const bestMatch = scoredElements[0];
      return bestMatch.element;
    }
    return null;
  }

  public findElementsInGroup(groupName: string): HTMLElement[] {
    return Array.from(document.querySelectorAll(`[name="${groupName}"]`));
  }

  /**
   * Calculates the Longest Common Subsequence of tokens.
   */
  private calculateTokenLCS(tokens1: string[], tokens2: string[]): number {
    const m = tokens1.length;
    const n = tokens2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokens1[i - 1] === tokens2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  public calculateMatchScore(voiceName: string, targetName: string): number {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

    const voiceNameNormalized = voiceName.toLowerCase();
    const targetNameNormalized = targetName.toLowerCase();

    const voiceTokens = normalize(voiceName);
    const targetTokens = normalize(targetName);

    if (voiceTokens.length === 0 || targetTokens.length === 0) return 0;

    let score = 0;

    // 1. Exact match bonus (highest weight)
    if (voiceNameNormalized === targetNameNormalized) {
      score += 100;
    }

    // 2. Contained Phrase Bonus (addresses substring bias)
    // Matches "save" within "save as" but not as a partial word
    if ((' ' + voiceNameNormalized + ' ').includes(' ' + targetNameNormalized + ' ')) {
      score += 40;
    }

    // 3. Token Overlap Score (Jaccard-like, order-agnostic)
    const matchingTokens = voiceTokens.filter(vToken => targetTokens.includes(vToken));
    const unionSize = new Set([...voiceTokens, ...targetTokens]).size;
    if (unionSize > 0) {
      score += (matchingTokens.length / unionSize) * 30;
    }

    // 4. Token Order Score (LCS) - crucial for multi-word commands
    const lcsLength = this.calculateTokenLCS(voiceTokens, targetTokens);
    const maxLen = Math.max(voiceTokens.length, targetTokens.length);
    if (maxLen > 0) {
      score += (lcsLength / maxLen) * 50;
    }

    // 5. Proximity/Typo Score (Levenshtein on full strings)
    score += this.getLevenshteinSimilarity(voiceNameNormalized, targetNameNormalized) * 20;

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

  // --- Action Executors ---

  private executeElementAction(entities: ProcessedEntities, actionType: string): boolean {
    if (!entities.target || !entities.targetElement) {
      return false;
    }
    switch (actionType) {
      case 'click':
        entities.targetElement.click();
        break;
      case 'scroll':
        entities.targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
    }
    return true;
  }

  private executeInputAction(entities: ProcessedEntities): boolean {
    if (!entities.target || !entities.value || !entities.targetElement) {
      return false;
    }
    if (entities.targetElement instanceof HTMLInputElement ||
      entities.targetElement instanceof HTMLTextAreaElement) {
      (entities.targetElement as HTMLInputElement | HTMLTextAreaElement).value = entities.value;
      entities.targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      entities.targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  private executeCheckboxAction(entities: ProcessedEntities, check: boolean): boolean {
    if (!entities.target || !entities.targetElement) {
      return false;
    }
    if (entities.targetElement instanceof HTMLInputElement && entities.targetElement.type === 'checkbox') {
      if (entities.targetElement.checked !== check) {
        entities.targetElement.checked = check;
        entities.targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
    return false;
  }

  private executeMultipleCheckboxAction(entities: ProcessedEntities, check: boolean): boolean {
    if (!entities.targetElements || entities.targetElements.length === 0) {
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
    if (!entities.target || !entities.targetElement) {
      return false;
    }
    if (entities.groupElement instanceof HTMLSelectElement) {
      return this.selectInDropdown(entities.groupElement, entities.target);
    }
    if (entities.targetElement instanceof HTMLInputElement && entities.targetElement.type === 'radio') {
      if (!entities.targetElement.checked) {
        entities.targetElement.checked = true;
        entities.targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
    return false;
  }

  private executeOpenDropdownAction(entities: ProcessedEntities): boolean {
    if (!entities.target || !entities.targetElement) {
      return false;
    }
    const element = entities.targetElement;
    if (element instanceof HTMLSelectElement) {
      element.focus();
      element.click();
      element.size = element.options.length;
      setTimeout(() => element.size = 1, 5000);
      return true;
    }
    const trigger = element.querySelector('[aria-expanded], button, [role="button"]') || element;
    (trigger as HTMLElement).focus();
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }

  private selectInDropdown(selectElement: HTMLSelectElement, targetValue: string): boolean {
    const options = Array.from(selectElement.options);
    const targetLower = targetValue.toLowerCase();
    for (const option of options) {
      const optionText = option.textContent?.toLowerCase() || '';
      const optionValue = option.value.toLowerCase();
      if (optionText === targetLower ||
        optionValue === targetLower ||
        optionText.includes(targetLower) ||
        this.calculateMatchScore(optionText, targetLower) > 50) {
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  private executeScrollAction(entities: ProcessedEntities): boolean {
    if (!entities.direction) {
      return false;
    }
    const scrollAmount = 300;
    const direction = entities.direction.toLowerCase();
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
          return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private executeScrollToElementAction(entities: ProcessedEntities): boolean {
    if (!entities.target || !entities.targetElement) {
      return false;
    }
    try {
      const rect = entities.targetElement.getBoundingClientRect();
      const isInView = rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
      if (isInView) {
        if (entities.targetElement instanceof HTMLElement) {
          if (entities.targetElement.tabIndex >= 0 ||
            entities.targetElement instanceof HTMLInputElement ||
            entities.targetElement instanceof HTMLTextAreaElement ||
            entities.targetElement instanceof HTMLSelectElement ||
            entities.targetElement instanceof HTMLButtonElement ||
            entities.targetElement instanceof HTMLAnchorElement) {
            entities.targetElement.focus();
          }
          entities.targetElement.click();
        }
      } else {
        entities.targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        if (entities.targetElement instanceof HTMLElement &&
          (entities.targetElement.tabIndex >= 0 ||
            entities.targetElement instanceof HTMLInputElement ||
            entities.targetElement instanceof HTMLTextAreaElement ||
            entities.targetElement instanceof HTMLSelectElement ||
            entities.targetElement instanceof HTMLButtonElement ||
            entities.targetElement instanceof HTMLAnchorElement)) {
          entities.targetElement.focus();
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private executeGoBackAction(entities: ProcessedEntities): boolean {
    try {
      window.history.back();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// --- Element Processors ---

class SingleTargetProcessor implements ElementProcessor {
  constructor(private actuator: VoiceActuator) { }
  canProcess(intent: string, entities: Entities): boolean {
    return !!entities.target && !entities.group && !entities.targetGroup;
  }
  process(entities: Entities): Partial<ProcessedEntities> {
    const targetElement = this.actuator.findElement(entities.target!);
    return { targetElement };
  }
}

class MultipleTargetProcessor implements ElementProcessor {
  canProcess(intent: string, entities: Entities): boolean {
    return !!entities.targetGroup;
  }
  process(entities: Entities): Partial<ProcessedEntities> {
    const targetElements = Array.from(
      document.querySelectorAll(`[name="${entities.targetGroup}"]`)
    ).filter((element): element is HTMLElement => element instanceof HTMLElement);
    return { targetElements };
  }
}

class GroupedTargetProcessor implements ElementProcessor {
  constructor(private actuator: VoiceActuator) { }
  canProcess(intent: string, entities: Entities): boolean {
    return !!entities.target && (!!entities.group || this.shouldAutoDetectGroup(intent, entities));
  }
  process(entities: Entities): Partial<ProcessedEntities> {
    let groupElement: HTMLElement | null = null;
    let targetElement: HTMLElement | null = null;
    if (entities.group) {
      groupElement = this.actuator.findElement(entities.group);
      if (!groupElement) {
        return { groupElement: null, targetElement: null };
      }
    } else {
      groupElement = this.detectSingleGroup();
      if (!groupElement) {
        return { targetElement: this.actuator.findElement(entities.target!) };
      }
    }
    if (groupElement && entities.target) {
      if (groupElement instanceof HTMLSelectElement) {
        targetElement = this.findTargetInDropdown(groupElement, entities.target);
        if (!targetElement) {
          return { groupElement, targetElement: null };
        }
        targetElement = groupElement;
      } else {
        targetElement = this.findTargetInRadioGroup(groupElement, entities.target);
        if (!targetElement) {
          return { groupElement, targetElement: null };
        }
      }
    }
    return { groupElement, targetElement };
  }
  private shouldAutoDetectGroup(intent: string, entities: Entities): boolean {
    return intent === IntentTypes.SELECT_RADIO_OR_DROPDOWN;
  }
  private detectSingleGroup(): HTMLElement | null {
    const dropdowns = document.querySelectorAll('select[voice\\.name]');
    const radioGroups = this.getUniqueRadioGroups();
    if (dropdowns.length === 1 && radioGroups.length === 0) {
      return dropdowns[0] as HTMLElement;
    } else if (dropdowns.length === 0 && radioGroups.length === 1) {
      const firstRadio = document.querySelector(`input[type="radio"][name="${radioGroups[0]}"]`);
      return firstRadio as HTMLElement;
    }
    return null;
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
  private findTargetInDropdown(selectElement: HTMLSelectElement, targetName: string): HTMLElement | null {
    const options = Array.from(selectElement.options);
    const targetLower = targetName.toLowerCase();
    for (const option of options) {
      const optionText = option.textContent?.toLowerCase() || '';
      const optionValue = option.value.toLowerCase();
      if (optionText === targetLower ||
        optionValue === targetLower ||
        optionText.includes(targetLower) ||
        this.actuator.calculateMatchScore(optionText, targetLower) > 50) {
        return option as HTMLElement;
      }
    }
    return null;
  }
  private findTargetInRadioGroup(groupElement: HTMLElement, targetName: string): HTMLElement | null {
    const groupName = groupElement.getAttribute('name') || '';
    const radioButtons = document.querySelectorAll(`input[type="radio"][name="${groupName}"][value]`);
    let bestMatch: HTMLElement | null = null;
    let bestScore = 0;
    for (const radio of radioButtons) {
      const voiceName = radio.getAttribute('value')?.toLowerCase() || '';
      const score = this.actuator.calculateMatchScore(voiceName, targetName.toLowerCase());
      if (score > bestScore && score > 50) {
        bestScore = score;
        bestMatch = radio as HTMLElement;
      }
    }
    return bestMatch;
  }
}

// --- Value Normalizers ---

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
      const cleanValue = value
        .replace(/,/g, '')
        .replace(/\band\b/gi, '')
        .replace(/\s+/g, '');
      const match = cleanValue.match(/-?\d+(?:\.\d+)?/);
      if (match) {
        return parseFloat(match[0]).toString();
      }
      return value;
    } catch (error) {
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
        if (element instanceof HTMLInputElement) {
          const { min, max } = element;
          if (min && formattedDate < min) return min;
          if (max && formattedDate > max) return max;
        }
        return formattedDate;
      }
      return value;
    } catch (error) {
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
        if (element instanceof HTMLInputElement) {
          const { min, max } = element;
          if (min && formattedTime < min) return min;
          if (max && formattedTime > max) return max;
        }
        return formattedTime;
      }
      return value;
    } catch (error) {
      return value;
    }
  }
}