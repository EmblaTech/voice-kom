// voice-actuator.ts
import { injectable, inject } from 'inversify';
import { TYPES, IntentResult } from '../types';
import { EventBus, VoiceLibEvents } from '../eventbus';

@injectable()
export class VoiceActuator {
  constructor(
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  /**
   * Performs an action based on the intent
   * @param intent The intent result from NLU processing
   * @returns A boolean indicating whether an action was performed
   */
  public performAction(intent: IntentResult): boolean {
    console.log('VoiceActuator: Performing action for intent', intent);
    
    // Only process click_element intents
    if (intent.intent === 'click_element' && intent.entities && intent.entities.target) {
      const targetName = intent.entities.target.toLowerCase();
      return this.clickElementByVoiceName(targetName);
    }
    
    console.log('VoiceActuator: No matching action for intent', intent.intent);
    return false;
  }
  
  /**
   * Finds and clicks an element with the matching voice.name attribute
   * @param targetName The target name to match against voice.name attributes
   * @returns True if an element was found and clicked, false otherwise
   */
  private clickElementByVoiceName(targetName: string): boolean {
    // Query all elements with voice.name attribute
    const elements = document.querySelectorAll('[voice\\.name]');
    console.log(`VoiceActuator: Found ${elements.length} elements with voice.name attributes`);
    
    // Convert NodeList to Array to ensure TypeScript recognizes it as iterable
    const elementsArray = Array.from(elements);
    
    // Try to find an element with a matching voice.name
    for (const element of elementsArray) {
      const voiceName = element.getAttribute('voice.name')?.toLowerCase();
      
      if (voiceName && this.isMatchingTarget(voiceName, targetName)) {
        console.log(`VoiceActuator: Found matching element with voice.name "${voiceName}"`);
        
        // Click the element
        if (element instanceof HTMLElement) {
          console.log(`VoiceActuator: Clicking element:`, element);
          element.click();
          
          // Emit an event that the action was performed
          this.eventBus.emit(VoiceLibEvents.ACTION_PERFORMED, {
            intent: 'click_element',
            target: voiceName
          });
          
          return true;
        }
      }
    }
    
    console.log(`VoiceActuator: No matching element found for target "${targetName}"`);
    this.eventBus.emit(VoiceLibEvents.ACTION_PAUSED);
    return false;
  }
  
  /**
   * Checks if the target name matches the voice name
   * Implements fuzzy matching logic if needed
   */
  private isMatchingTarget(voiceName: string, targetName: string): boolean {
    // Basic direct match
    if (voiceName === targetName) {
      return true;
    }
    
    // Contains match (e.g., "cancel button" matches "cancel")
    if (voiceName.includes(targetName) || targetName.includes(voiceName)) {
      return true;
    }
    
    // Could add more sophisticated matching logic here if needed
    
    return false;
  }
}