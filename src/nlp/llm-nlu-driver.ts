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
   * Generate system prompt for the LLM based on available commands with multilingual support
   */
  private generateSystemPrompt(): string {
    if (!this.commandRegistry) {
      return '';
    }
    
    // Language-specific instructions
    const languageInstruction = this.language !== 'en' 
      ? `The user input will be in ${this.getLanguageName(this.language)}. You should understand the meaning of the input in that language and match it to the appropriate English command intents listed below. Focus on the semantic meaning rather than exact word matching.\n\n`
      : '';
    
    // Base system instruction with enhanced LLM autonomy
    let systemPrompt = `You are an advanced intent classification system with full autonomy to understand and interpret user commands for web UI interactions. Your task is to intelligently identify all possible intents from the user's speech input and extract relevant entities for each intent.

${languageInstruction}You have access to the following intent categories: ${this.availableIntents.filter(i => i !== IntentTypes.UNKNOWN).join(', ')}.

For each intent category, here are the types of entities you should look for:
`;

    // Add each intent's entity information only (no utterance patterns)
    Object.entries(this.commandRegistry).forEach(([intentName, config]) => {
      if (intentName === IntentTypes.UNKNOWN) return;
      
      systemPrompt += `\nIntent: ${intentName}
Expected entities: ${config.entities.join(', ')}
Purpose: Use your understanding to determine if the user's input semantically matches this intent type for web UI interaction.`;
    });

    // Enhanced multilingual processing instructions
    const multilingualInstructions = this.language !== 'en' 
      ? `\n\nIMPORTANT MULTILINGUAL PROCESSING:
- The user input is in ${this.getLanguageName(this.language)}
- Use your language understanding capabilities to interpret the semantic meaning
- Match the meaning to the most appropriate English intent categories
- Extract entities based on semantic understanding, not literal translation
- Normalize target/group entities to clear English descriptions
- Normalize directional entities to English cardinal directions (e.g., "left", "right", "up", "down")
- Normalize numeric, date, and time entities to standard English format
- Preserve input values as-is when they represent user data`
      : '';

    // Enhanced response format instructions with full LLM decision making
    systemPrompt += `${multilingualInstructions}

INSTRUCTIONS FOR INTENT CLASSIFICATION:
You have full autonomy to interpret user commands. Use your understanding of:
- Natural language semantics and context
- Web UI interaction patterns
- User intent behind different phrasings
- Command variations and synonyms
- Multi-step or compound commands

Don't rely on exact phrase matching - use your intelligence to understand what the user wants to accomplish on a web interface.

Respond with a JSON array containing multiple intents in order of likelihood or relevance. Each intent should be a JSON object containing:
1. "intent": The identified intent name (use "unknown" only if genuinely unclear)
2. "confidence": A number between 0 and 1 indicating your confidence level
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

Use your full language understanding capabilities to interpret user intent, even for:
- Colloquial expressions
- Implied actions
- Context-dependent commands
- Creative or unusual phrasings
- Commands with missing explicit targets

IMPORTANT: Return ONLY the raw JSON array without any markdown formatting, code blocks, or backticks. Do not wrap the JSON in \`\`\` or any other formatting.`;

    return systemPrompt;
  }

  /**
   * Get human-readable language name from language code
   */
  private getLanguageName(langCode: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'mt': 'Maltese',
      'ga': 'Irish',
      'cy': 'Welsh',
      'eu': 'Basque',
      'ca': 'Catalan',
      'gl': 'Galician',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',
      'sw': 'Swahili',
      'am': 'Amharic',
      'yo': 'Yoruba',
      'zu': 'Zulu',
      'xh': 'Xhosa',
      'af': 'Afrikaans',
      'sq': 'Albanian',
      'az': 'Azerbaijani',
      'be': 'Belarusian',
      'bn': 'Bengali',
      'bs': 'Bosnian',
      'my': 'Burmese',
      'km': 'Khmer',
      'ka': 'Georgian',
      'gu': 'Gujarati',
      'kk': 'Kazakh',
      'ky': 'Kyrgyz',
      'lo': 'Lao',
      'mk': 'Macedonian',
      'ml': 'Malayalam',
      'mn': 'Mongolian',
      'ne': 'Nepali',
      'ps': 'Pashto',
      'fa': 'Persian',
      'pa': 'Punjabi',
      'si': 'Sinhala',
      'ta': 'Tamil',
      'te': 'Telugu',
      'uk': 'Ukrainian',
      'ur': 'Urdu',
      'uz': 'Uzbek'
    };
    
    return languageNames[langCode] || langCode.toUpperCase();
  }

  /**
   * Identify multiple intents from input text using LLM with enhanced autonomy
   */
  async identifyIntent(text: string): Promise<IntentResult[]> {
    if (!this.apiKey) {
      throw new Error('LLM API key is required for intent identification');
    }
    
    try {
      // Generate system message with enhanced LLM autonomy
      const systemPrompt = this.generateSystemPrompt();
      
      // Prepare user message with language context if not English
      const userMessage = this.language !== 'en' 
        ? `Input language: ${this.getLanguageName(this.language)}\nUser command: ${text}`
        : text;
      
      // Call the LLM API with higher temperature for more creative interpretation
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
            { role: 'user', content: userMessage }
          ],
          temperature: 0.3 // Slightly higher temperature for better interpretation while maintaining consistency
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

  /**
   * Get current language setting
   */
  getCurrentLanguage(): string {
    return this.language;
  }
}