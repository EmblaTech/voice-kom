// compromise-nlu-driver.ts
import { injectable } from 'inversify';
import { INLUDriver, IntentResult, CommandRegistry } from '../types';
import nlp from 'compromise';

@injectable()
export class CompromiseNLUDriver implements INLUDriver {
  private language: string = 'en';
  private compromisePatterns: Map<string, string[]> = new Map();
  private entityMap: Map<string, string[]> = new Map();
  private availableIntents: string[] = ['UNKNOWN'];
  private commandRegistry: CommandRegistry | null = null;

  init(config: { language?: string; }): void {
    if (config.language) {
      this.language = config.language;
    }
    this.commandRegistry = {
      intents: [
        {
          name: "click_element",
          utterances: ["click (target)", "press (target)", "tap (target)"],
          entities: ["target"]
        },

        {
          name: "fill_input",
          utterances: ["Fill (target) with (value)"],
          entities: ["target"]
        }
      ]
    };
    
    // Initialize available intents and patterns
    if (this.commandRegistry) {
      this.availableIntents = this.commandRegistry.intents.map(intent => intent.name);
      
      // Add UNKNOWN intent if not already in the list
      if (!this.availableIntents.includes('UNKNOWN')) {
        this.availableIntents.push('UNKNOWN');
      }
      
      // Build pattern maps for each intent
      this.commandRegistry.intents.forEach(intent => {
        // Store original patterns and entities
        this.entityMap.set(intent.name, intent.entities);
      });
    }
  }

  /**
   * Converts a pattern with (entity) syntax to Compromise-friendly syntax
   * For example: "click (target)" becomes "click {target}"
   */
  private convertToCompromisePattern(pattern: string): string {
    // Replace (entity) with {entity}
    return pattern.replace(/\(([a-zA-Z0-9_]+)\)/g, '{$1}');
  }

  /**
   * Extract entity values from Compromise match results
   */
  private extractEntities(doc: any, pattern: string, text: string): Record<string, string> {
    const entities: Record<string, string> = {};
    const entityMatches = pattern.match(/\(([a-zA-Z0-9_]+)\)/g) || [];
    
    // Extract each entity name without parentheses
    for (const entityMatch of entityMatches) {
      const entityName = entityMatch.replace(/[()]/g, '');
      
      // Create a pattern to find this specific entity in the text
      const beforeEntityPattern = pattern.split(entityMatch)[0];
      const afterEntityPattern = pattern.split(entityMatch)[1] || '';
      
      // Create regex patterns to find the content before and after our entity
      const beforePattern = beforeEntityPattern
        .replace(/\([^)]+\)/g, '.*')  // Replace other entities with wildcard
        .trim()
        .replace(/\s+/g, '\\s+');     // Make whitespace flexible
      
      const afterPattern = afterEntityPattern
        .replace(/\([^)]+\)/g, '.*')  // Replace other entities with wildcard
        .trim()
        .replace(/\s+/g, '\\s+');     // Make whitespace flexible
      
      // If we have content before and after
      if (beforePattern && afterPattern) {
        const regex = new RegExp(`${beforePattern}\\s*(.*?)\\s*${afterPattern}`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          entities[entityName] = match[1].trim();
        }
      } 
      // If we only have content before
      else if (beforePattern) {
        const regex = new RegExp(`${beforePattern}\\s*(.*)`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          entities[entityName] = match[1].trim();
        }
      }
      // If we only have content after (unlikely)
      else if (afterPattern) {
        const regex = new RegExp(`(.*)\\s*${afterPattern}`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          entities[entityName] = match[1].trim();
        }
      }
    }
    
    return entities;
  }

  identifyIntent(text: string): IntentResult {
    // Check if language is not English
    if (this.language !== 'en') {
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        entities: {}
      };
    }
    
    const doc = nlp(text);
    
    // Default result is UNKNOWN
    let result: IntentResult = {
      intent: 'UNKNOWN',
      confidence: 0,
      entities: {}
    };
    
    // If no command registry, return UNKNOWN
    if (!this.commandRegistry) {
      return result;
    }
    
    let bestMatch = {
      intent: 'UNKNOWN',
      confidence: 0,
      entities: {}
    };
    
    // Try to match each intent pattern
    for (const intentName of this.availableIntents) {
      // Skip UNKNOWN intent
      if (intentName === 'UNKNOWN') continue;
      
      const patterns = this.commandRegistry.intents.find(intent => intent.name === intentName)?.utterances || [];
      
      for (const pattern of patterns) {
        // Get the compromise-friendly pattern
        const compromisePattern = this.convertToCompromisePattern(pattern);
        
        // Try exact match first using compromise's match method
        const matches = doc.match(compromisePattern);
        
        if (matches.found) {
          // Extract entity values using our helper
          const extractedEntities = this.extractEntities(doc, pattern, text);
          
          // Calculate confidence - simple heuristic
          // Higher confidence for more specific matches
          const wordCount = text.split(' ').length;
          const patternWordCount = pattern.replace(/\([^)]*\)/g, '').trim().split(/\s+/).length;
          
          // More confidence for patterns with more words (excluding entities)
          const specificityScore = patternWordCount / wordCount;
          
          // We give higher confidence for exact match
          const confidence = Math.min(0.8 + specificityScore, 1);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent: intentName,
              confidence: confidence,
              entities: extractedEntities
            };
          }
        }
        // If no exact match, try fuzzy match for commands
        else {
          // Get the command part (without entities)
          const commandPart = pattern.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
          const commandWords = commandPart.split(/\s+/);
          
          // Check if all command words are in the text
          let allWordsFound = true;
          for (const word of commandWords) {
            if (word && !text.toLowerCase().includes(word.toLowerCase())) {
              allWordsFound = false;
              break;
            }
          }
          
          if (allWordsFound) {
            // Extract entities
            const extractedEntities = this.extractEntities(doc, pattern, text);
            
            // If we have entities, it's likely a match
            if (Object.keys(extractedEntities).length > 0) {
              // Calculate confidence - less than exact match
              const confidence = 0.7;
              
              if (confidence > bestMatch.confidence) {
                bestMatch = {
                  intent: intentName,
                  confidence: confidence,
                  entities: extractedEntities
                };
              }
            }
          }
        }
      }
    }
    
    return bestMatch;
  }

  getAvailableIntents(): string[] {
    return this.availableIntents;
  }
}