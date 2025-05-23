import { injectable, inject } from 'inversify';
import { INLUDriver, IntentResult, IntentTypes, TYPES } from '../types';
import { NLUEngineConfig } from './model/nlpConfig';
import { ICommandRegistry } from './commandRegistry';

@injectable()
export class LLMNLUDriver implements INLUDriver {
  private language: string = 'en';
  private commandRegistry: ICommandRegistry | null = null;
  private availableIntents: IntentTypes[] = [IntentTypes.UNKNOWN];
  private apiKey: string = '';
  private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-4o';
  
  constructor(
    @inject(TYPES.CommandRegistry) private registryService: ICommandRegistry
  ) {}

  /**
   * Initialize the NLU driver with configuration options
   */
  init(lang: string, config: NLUEngineConfig): void {
    if (lang) {
      this.language = lang;
    }
    
    // Set API key if provided
    if (config.nluApiKey) {
      this.apiKey = config.nluApiKey;
    } else {
      throw new Error('LLM API key is required for LLM-based NLU');
    }
    
    // Use the injected command registry
    this.commandRegistry = this.registryService;
    
    // Setup available intents
    this.setupIntentsAndEntities();
  }

  /**
   * Setup available intents
   */
  private setupIntentsAndEntities(): void {
    if (!this.commandRegistry) return;
    
    // Extract intent names from object keys
    this.availableIntents = Object.keys(this.commandRegistry) as IntentTypes[];
    
    // Add UNKNOWN intent if not already included
    if (!this.availableIntents.includes(IntentTypes.UNKNOWN)) {
      this.availableIntents.push(IntentTypes.UNKNOWN);
    }
  }

  /**
   * Generate system prompt for the LLM based on available commands
   */
  private generateSystemPrompt(): string {
    if (!this.commandRegistry) {
      return '';
    }
    
    // Base system instruction
    let systemPrompt = `You are an intent classification system. Your task is to identify all possible intents from the user's speech input and extract relevant entities for each intent.
Available intents: ${this.availableIntents.filter(i => i !== IntentTypes.UNKNOWN).join(', ')}.

For each intent, here are few of the possible utterance patterns and required entities:
`;

    // Add each intent's patterns and entities
    Object.entries(this.commandRegistry).forEach(([intentName, config]) => {
      if (intentName === IntentTypes.UNKNOWN) return;
      
      systemPrompt += `\nIntent: ${intentName}
Utterance patterns: ${config.utterances.join(', ')}
Required entities: ${config.entities.join(', ')}`;
    });

    // Add response format instructions with multiple intent support
    systemPrompt += `\n\nRespond with a JSON array containing multiple intents in order of likelihood or priority. Each intent should be a JSON object containing:
1. "intent": The identified intent name (use "unknown" if unclear)
2. "confidence": A number between 0 and 1 indicating confidence level
3. "entities": An object with extracted entity values as key-value pairs

Example response for "click the submit button and then go back":
[
  {
    "intent": "click_element",
    "confidence": 0.95,
    "entities": {
      "target": "submit button"
    }
  },
  {
    "intent": "navigate",
    "confidence": 0.85,
    "entities": {
      "direction": "back"
    }
  }
]

If only one intent is detected, still return an array with that single intent.

IMPORTANT: Return ONLY the raw JSON array without any markdown formatting, code blocks, or backticks. Do not wrap the JSON in \`\`\` or any other formatting.`;

    return systemPrompt;
  }

  /**
   * Identify multiple intents from input text using LLM
   */
  async identifyIntent(text: string): Promise<IntentResult[]> {
    if (!this.apiKey) {
      throw new Error('LLM API key is required for intent identification');
    }
    
    try {
      // Generate system message
      const systemPrompt = this.generateSystemPrompt();
      
      // Call the LLM API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.1 // Low temperature for more deterministic results
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LLM API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Parse the JSON response from LLM
      try {
        // Clean the response by removing any markdown formatting that might be present
        content = this.cleanJsonResponse(content);
        
        const results = JSON.parse(content);
        
        // Ensure the response is an array
        if (!Array.isArray(results)) {
          // If a single object was returned, convert it to an array
          if (results.intent) {
            return [{
              intent: results.intent || IntentTypes.UNKNOWN,
              confidence: results.confidence || 0,
              entities: results.entities || {}
            }];
          }
          // If invalid format, return unknown
          return [this.createUnknownResult()];
        }
        
        // Process all intents in the array
        return results.map(result => ({
          intent: result.intent || IntentTypes.UNKNOWN,
          confidence: result.confidence || 0,
          entities: result.entities || {}
        }));
      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError);
        console.error('Raw LLM response:', content);
        return [this.createUnknownResult()];
      }
    } catch (error) {
      console.error('Error during LLM intent identification:', error);
      return [this.createUnknownResult()];
    }
  }

  /**
   * Clean JSON response from potential markdown formatting
   */
  private cleanJsonResponse(content: string): string {
    // Remove code block delimiters if present
    let cleaned = content.trim();
    
    // Remove markdown code block syntax (```json or just ```)
    const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)```$/;
    const match = cleaned.match(codeBlockRegex);
    
    if (match) {
      cleaned = match[1].trim();
    }
    
    return cleaned;
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

  /**
   * Get list of available intents
   */
  getAvailableIntents(): IntentTypes[] {
    return this.availableIntents;
  }
  
  /**
   * Method to change API endpoint (for testing or using compatible services)
   */
  setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
  }
  
  /**
   * Method to change LLM model
   */
  setModel(modelName: string): void {
    this.model = modelName;
  }
}