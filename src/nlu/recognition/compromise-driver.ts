import { IntentResult, IntentTypes, RecognitionConfig } from "../../types";
import { Logger } from "../../utils/logger";
import { RecognitionDriver } from "./driver";
import nlp from 'compromise';

interface CommandConfig {
    utterances: string[];
    entities: string[];
}
  
// Interface for the command registry
export interface ICommandRegistry {
  [key: string]: CommandConfig;
}


export class CompromiseRecognitionDriver implements RecognitionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: RecognitionConfig;
    private commandRegistry: ICommandRegistry | null = null;
    private availableIntents: IntentTypes[] = [IntentTypes.UNKNOWN];
    private entityMap: Map<string, string[]> = new Map();
  
    // Common polite phrases to strip from input
    private politePhrases: string[] = [
        'please', 'can you', 'could you', 'would you', 
        'kindly', 'i want to', 'i would like to', 'i need to',
        'thanks', 'thank you'
    ];

    constructor(config: RecognitionConfig) {
        this.config = config;
        this.setUpCommandRegistry()
        this.setupIntentsAndEntities();
    }

    detectIntent(text: string): IntentResult {
        return this.findBestMatch(text);
    }
     
    getAvailableIntents(): IntentTypes[] {
        return this.availableIntents;
      }

    private setUpCommandRegistry(): void {
        // Initialize with default command registry if needed
    this.commandRegistry = {
        [IntentTypes.CLICK_ELEMENT]: {
          utterances: ["click (target)", "press (target)", "tap (target)"],
          entities: ["target"]
        },
        [IntentTypes.FILL_INPUT]: {
          utterances: ["Fill (target) as (value)", "Enter (target) as (value)","Enter (target) with (value)", "Fill (target) with (value)"],
          entities: ["target", "value"]
        },
        [IntentTypes.SCROLL_TO_ELEMENT]: {
          utterances: ["scroll to (target)", "go to (target) section"],
          entities: ["target"]
        }
      };
    }

    private setupIntentsAndEntities(): void {
        if (!this.commandRegistry) return;
        
        // Extract intent names from object keys
        this.availableIntents = Object.keys(this.commandRegistry) as IntentTypes[];
        
        // Add UNKNOWN intent if not already included
        if (!this.availableIntents.includes(IntentTypes.UNKNOWN)) {
          this.availableIntents.push(IntentTypes.UNKNOWN);
        }
        
        // Build entity maps for each intent
        Object.entries(this.commandRegistry).forEach(([intentName, config]) => {
          this.entityMap.set(intentName, config.entities);
        });
      }
    
      /**
       * Converts a pattern with (entity) syntax to Compromise-friendly syntax
       */
      private convertToCompromisePattern(pattern: string): string {
        return pattern.replace(/\(([a-zA-Z0-9_]+)\)/g, '{$1}');
      }
    
      /**
       * Preprocess input text to remove polite phrases and clean up
       */
      private preprocessInputText(text: string): string {
        let cleanedText = text.trim();
        
        // Remove polite phrases from beginning and end
        for (const phrase of this.politePhrases) {
          // Remove from beginning
          const startRegex = new RegExp(`^${phrase}\\s+`, 'i');
          cleanedText = cleanedText.replace(startRegex, '');
          
          // Remove from end
          const endRegex = new RegExp(`\\s+${phrase}[,.!?]*$`, 'i');
          cleanedText = cleanedText.replace(endRegex, '');
        }
        
        return cleanedText.trim();
      }
    
      /**
       * Clean extracted entity values
       */
      private cleanEntityValue(value: string): string {
        if (!value) return '';
        
        // Remove leading/trailing punctuation
        let cleaned = value.trim();
        cleaned = cleaned.replace(/^[,.!?;:]+|[,.!?;:]+$/g, '');
        
        // Remove polite phrases that might be part of entity extraction
        for (const phrase of this.politePhrases) {
          // Remove from beginning
          const startRegex = new RegExp(`^${phrase}\\s+`, 'i');
          cleaned = cleaned.replace(startRegex, '');
          
          // Remove from end
          const endRegex = new RegExp(`\\s+${phrase}$`, 'i');
          cleaned = cleaned.replace(endRegex, '');
        }
        
        return cleaned.trim();
      }
    
      /**
       * Extract entity values from text based on the pattern
       */
      private extractEntities(text: string, pattern: string): Record<string, string> {
        const entities: Record<string, string> = {};
        const entityMatches = pattern.match(/\(([a-zA-Z0-9_]+)\)/g) || [];
        
        // First preprocess the text
        const preprocessedText = this.preprocessInputText(text);
        
        for (const entityMatch of entityMatches) {
          const entityName = entityMatch.replace(/[()]/g, '');
          const [beforePattern, afterPattern] = this.getContextPatterns(pattern, entityMatch);
          
          // Extract entity value with appropriate regex pattern
          const rawValue = this.extractEntityValue(preprocessedText, beforePattern, afterPattern);
          
          // Clean the extracted entity value
          entities[entityName] = this.cleanEntityValue(rawValue);
        }
        
        return entities;
      }
    
      /**
       * Get regex patterns for content before and after an entity
       */
      private getContextPatterns(pattern: string, entityMatch: string): [string, string] {
        const [beforeEntityPattern, afterEntityPattern = ''] = pattern.split(entityMatch);
        
        // Create regex patterns with flexible whitespace
        const beforePattern = beforeEntityPattern
          .replace(/\([^)]+\)/g, '.*')
          .trim()
          .replace(/\s+/g, '\\s+');
          
        const afterPattern = afterEntityPattern
          .replace(/\([^)]+\)/g, '.*')
          .trim()
          .replace(/\s+/g, '\\s+');
          
        return [beforePattern, afterPattern];
      }
    
      /**
       * Extract entity value using regex patterns
       */
      private extractEntityValue(text: string, beforePattern: string, afterPattern: string): string {
        if (beforePattern && afterPattern) {
          const regex = new RegExp(`${beforePattern}\\s*(.*?)\\s*${afterPattern}`, 'i');
          const match = text.match(regex);
          if (match && match[1]) return match[1].trim();
        } 
        else if (beforePattern) {
          const regex = new RegExp(`${beforePattern}\\s*(.*)`, 'i');
          const match = text.match(regex);
          if (match && match[1]) return match[1].trim();
        }
        else if (afterPattern) {
          const regex = new RegExp(`(.*)\\s*${afterPattern}`, 'i');
          const match = text.match(regex);
          if (match && match[1]) return match[1].trim();
        }
        
        return '';
      }
    
      /**
       * Calculate confidence score based on pattern match
       */
      private calculateConfidence(pattern: string, text: string, hasExactMatch: boolean): number {
        const wordCount = text.split(' ').length;
        const patternWordCount = pattern.replace(/\([^)]*\)/g, '').trim().split(/\s+/).length;
        const specificityScore = patternWordCount / wordCount;
        
        // Higher confidence for exact matches
        return hasExactMatch 
          ? Math.min(0.8 + specificityScore, 1)
          : 0.7;
      }
    
      /**
       * Try to match text using exact and fuzzy matching techniques
       */
      private findBestMatch(text: string): IntentResult {
        if (this.config.lang !== 'en' || !this.commandRegistry) {
          return this.createUnknownResult();
        }
        
        // Preprocess the input text to remove polite phrases
        const preprocessedText = this.preprocessInputText(text);
        const doc = nlp(preprocessedText);
        let bestMatch = this.createUnknownResult();
        
        // Try to match each intent pattern
        for (const intentName of this.availableIntents) {
          if (intentName === IntentTypes.UNKNOWN) continue;
          
          const CommandConfig = this.commandRegistry[intentName];
          if (!CommandConfig) continue;
          
          for (const pattern of CommandConfig.utterances) {
            const result = this.matchPattern(doc, pattern, preprocessedText);
            
            if (result.confidence > bestMatch.confidence) {
              bestMatch = result;
              bestMatch.intent = intentName;
            }
          }
        }
        
        return bestMatch;
      }
    
      /**
       * Try to match a specific pattern against the text
       */
      private matchPattern(doc: any, pattern: string, text: string): IntentResult {
        // Try exact match first
        const compromisePattern = this.convertToCompromisePattern(pattern);
        const matches = doc.match(compromisePattern);
        
        if (matches.found) {
          return {
            intent: IntentTypes.UNKNOWN,
            confidence: this.calculateConfidence(pattern, text, true),
            entities: this.extractEntities(text, pattern)
          };
        }
        
        // Try fuzzy match
        return this.tryFuzzyMatch(pattern, text);
      }
    
      /**
       * Try fuzzy matching for the pattern
       */
      private tryFuzzyMatch(pattern: string, text: string): IntentResult {
        const commandPart = pattern.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
        const commandWords = commandPart.split(/\s+/);
        
        // Check if all command words are in the text
        const allWordsFound = commandWords.every(word => 
          word && text.toLowerCase().includes(word.toLowerCase())
        );
        
        if (allWordsFound) {
          const extractedEntities = this.extractEntities(text, pattern);
          
          // If we have entities, it's likely a match
          if (Object.keys(extractedEntities).length > 0) {
            return {
              intent: IntentTypes.UNKNOWN,
              confidence: this.calculateConfidence(pattern, text, false),
              entities: extractedEntities
            };
          }
        }
        
        return this.createUnknownResult();
      }
    
      /**
       * Create a default unknown result
       */
      private createUnknownResult(): IntentResult {
        return {
          intent: IntentTypes.UNKNOWN,
          confidence: 0,
          entities: {}
        };
      }
}