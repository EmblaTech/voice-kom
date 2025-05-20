import { injectable, inject } from 'inversify';
import { TYPES, IntentResult, Entities, Action, IntentTypes } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';

// Interface for processed entities with resolved DOM elements
interface ProcessedEntities extends Entities {
  targetElement?: HTMLElement | null;
}

@injectable()
export class VoiceActuator {
  private actionMap!: Map<IntentTypes, Action>;
  
  constructor(
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {
    this.initializeActionMap();
  }

  private initializeActionMap(): void {
    this.actionMap = new Map<IntentTypes, Action>();
    
    // Register all actions here
    this.registerAction(IntentTypes.CLICK_ELEMENT, { execute: (entities) => this.clickElementAction(entities)});
    this.registerAction(IntentTypes.FILL_INPUT, { execute: (entities) => this.fillInputAction(entities)});

    // Add more actions as needed
    // this.registerAction('open_menu', { execute: (entities) => this.openMenuAction(entities) });
    // this.registerAction('navigate_to', { execute: (entities) => this.navigateToAction(entities) });
  }
  
  private registerAction(intentName: IntentTypes, action: Action): void {
    this.actionMap.set(intentName, action);
  }

  private processEntities(intent: string, entities: Entities): ProcessedEntities {
    const processedEntities: ProcessedEntities = { ...entities };
    
    // Process target entity for actions that need DOM elements
    if (entities.target) {
      const targetName = entities.target.toLowerCase();
      const element = this.findTargetElement(targetName);
      processedEntities.targetElement = element;
      
      if (!element) {
        console.log(`VoiceActuator: No matching element found for target "${targetName}"`);
      }
    }
    if (processedEntities.targetElement instanceof HTMLInputElement && processedEntities.targetElement.type === 'email') {
      processedEntities.value= this.normalizeEmailValue(entities.value);
      console.log(processedEntities.value)
    }

    return processedEntities;
  }
  private normalizeEmailValue(spoken: string): string {
    return spoken
      .replace(/\bat\b/gi, '@')
      .replace(/\bdot\b/gi, '.')
      .replace(/\bunderscore\b/gi, '_')
      .replace(/\bdash\b/gi, '-')
      .replace(/\bplus\b/gi, '+')
      .replace(/\s+/g, '') // remove spaces
      .trim();
  }
  public performAction(intent: IntentResult): boolean {
    const action = this.actionMap.get(intent.intent);
    
    if (!action) {
      console.log(`VoiceActuator: No action registered for intent '${intent.intent}'`);
      this.eventBus.emit(SpeechEvents.ACTION_PAUSED);
      return false;
    }
    
    // Process and validate entities before executing the action
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
    
    return result;
  }
  
  private findTargetElement(targetName: string): HTMLElement | null {
    // Query all elements with voice.name attribute
    const elements = document.querySelectorAll('[voice\\.name]');
    console.log(`VoiceActuator: Found ${elements.length} elements with voice.name attributes`);
    
    // Try to find an element with a matching voice.name
    for (const element of Array.from(elements)) {
      const voiceName = element.getAttribute('voice.name')?.toLowerCase();
      
      if (voiceName && this.isMatchingTarget(voiceName, targetName)) {
        console.log(`VoiceActuator: Found matching element with voice.name "${voiceName}"`);
        
        if (element instanceof HTMLElement) {
          return element;
        }
      }
    }
    return null;
  }

  private isMatchingTarget(voiceName: string, targetName: string): boolean {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  
    const voiceTokens = normalize(voiceName);
    const targetTokens = normalize(targetName);
  
    // Exact or subset matches
    if (voiceName === targetName || 
        voiceName.includes(targetName) || 
        targetName.includes(voiceName)) {
      return true;
    }
  
    // Token overlap check (e.g., "full name" and "my name" share "name")
    const overlap = voiceTokens.filter(token => targetTokens.includes(token));
    if (overlap.length > 0) {
      return true;
    }
  
    return false;
  }

  /* ACTIONS DEFINED HERE */

  private clickElementAction(entities: ProcessedEntities): boolean {
      if (!entities.target) {
        console.log('VoiceActuator: No target specified for click_element intent');
        return false;
      }
      const targetElement = entities.targetElement;
      if (!targetElement) {
        // Already logged in processEntities
        return false;
      }
      console.log(`VoiceActuator: Clicking element:`, targetElement);
      targetElement.click();
      return true;
    }

  private fillInputAction(entities: ProcessedEntities): boolean {
    if (!entities.target) {
      console.log('VoiceActuator: No target specified for fill_input intent');
      return false;
    }
    if (!entities.value) {
      console.log('VoiceActuator: No value provided for fill_input intent');
      return false;
    }
  
    const targetElement = entities.targetElement;
    if (!targetElement) {
      // Already logged in processEntities
      return false;
    }
  
    if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
      targetElement.value = entities.value;
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`VoiceActuator: Filled input "${entities.target}" with value "${entities.value}"`);
      return true;
    } else {
      console.log(`VoiceActuator: Target element is not an input or textarea`);
      return false;
    }
  }


}