import { RecognitionConfig, IntentResult, IntentTypes } from "../../types";
import { Logger } from "../../utils/logger";
import { RecognitionDriver } from "./driver";

interface CommandConfig {
    utterances: string[];
    entities: string[];
}
  
interface CommandRegistry {
    [key: string]: CommandConfig;
}

export class OpenAIRecognitionDriver implements RecognitionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: RecognitionConfig;
    private language: string = 'en';
    private commandRegistry: CommandRegistry | null = null;
    private availableIntents: IntentTypes[] = [IntentTypes.UNKNOWN];
    private apiKey: string = '';
    private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
    private model: string = 'gpt-4o';

    constructor(config: RecognitionConfig) {
        console.log("openai-driver.ts constructor()...");
        this.config = config;
        this.language = config.lang || this.language;
        this.apiKey = config.apiKey || '';
        this.setUpCommandRegistry();
        this.setupIntentsAndEntities();
        this.logger.info(`OpenAI RecognitionDriver initialized with config: ${JSON.stringify(config)}`);
    }

    // constructor(@inject(TYPES.CommandRegistry) private registryService: ICommandRegistry) {
    //     console.log("llm-nlu-driver.ts constructor()...");
    // }

    /**
     * Initialize the driver with configuration options
     */
    init(lang: string, config: RecognitionConfig): void {
        console.log("openai-driver.ts init()...");
        if (lang) {
            this.language = lang;
        }
        
        if (config.apiKey) {
            this.apiKey = config.apiKey;
        } else {
            throw new Error('OpenAI API key is required for LLM-based NLU');
        }
        
        this.setUpCommandRegistry();
        this.setupIntentsAndEntities();
    }

    /**
     * Detect intent from input text using OpenAI LLM
     */
    async detectIntent(text: string): Promise<IntentResult[]> {
        console.log("==== openai-driver.ts detectIntent() text: ", text);
        this.logger.info(`Detecting intent for text: ${text}`);
        
        if (!this.apiKey) {
            throw new Error('OpenAI API key is required for intent identification');
        }
        
        try {
            const systemPrompt = this.generateSystemPrompt();
            const userMessage = this.language !== 'en' 
                ? `Input language: ${this.getLanguageName(this.language)}\nUser command: ${text}`
                : text;
            
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
                    temperature: 0.3
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            
            const data = await response.json();
            let content = data.choices[0].message.content;
            
            try {
                content = this.cleanJsonResponse(content);
                const results = JSON.parse(content);
                console.log("openai-driver.ts detectIntent() results 1: ", results);

                if (!Array.isArray(results)) {
                    // If a single object was returned, convert it to an array
                    if (results.intent) {
                        console.log("llm-nlu-driver.ts results 1: ", results);
                        return [{
                            intent: results.intent || IntentTypes.UNKNOWN,
                            confidence: results.confidence || 0,
                            entities: results.entities || {}
                        }];
                    }
                    // If invalid format, return unknown
                    console.log("llm-nlu-driver.ts createUnknownResult()...");
                    return [this.createUnknownResult()];
                }

                console.log("openai-driver.ts detectIntent() results 2: ", results);
                return results.map(result => ({
                    intent: result.intent || IntentTypes.UNKNOWN,
                    confidence: result.confidence || 0,
                    entities: result.entities || {}
                }));
                
            } catch (parseError) {
                this.logger.error('Error parsing OpenAI response:', parseError);
                this.logger.error('Raw OpenAI response:', content);
                return [this.createUnknownResult()];
            }
        } catch (error) {
            this.logger.error('Error during OpenAI intent identification:', error);
            return [this.createUnknownResult()];
        }
    }

    getAvailableIntents(): IntentTypes[] {
        console.log("openai-driver.ts getAvailableIntents()...");
        return this.availableIntents;
    }

    /**
     * Setup available intents
     */
    private setupIntentsAndEntities(): void {
        console.log("openai-driver.ts setupIntentsAndEntities()...");
        if (!this.commandRegistry) return;
        
        this.availableIntents = Object.keys(this.commandRegistry) as IntentTypes[];
        
        if (!this.availableIntents.includes(IntentTypes.UNKNOWN)) {
            this.availableIntents.push(IntentTypes.UNKNOWN);
        }
    }

    /**
     * Generate system prompt for the LLM based on available commands with multilingual support
     */
    private generateSystemPrompt(): string {
        console.log("openai-driver.ts generateSystemPrompt()...");
        if (!this.commandRegistry) {
            return '';
        }
        
        const languageInstruction = this.language !== 'en' 
            ? `The user input will be in ${this.getLanguageName(this.language)}. You should understand the meaning of the input in that language and match it to the appropriate English command intents listed below. Focus on the semantic meaning rather than exact word matching.\n\n`
            : '';
        
        let systemPrompt = `You are an advanced intent classification system with full autonomy to understand and interpret user commands for web UI interactions. Your task is to intelligently identify all possible intents from the user's speech input and extract relevant entities for each intent.

${languageInstruction}You have access to the following intent categories: ${this.availableIntents.filter(i => i !== IntentTypes.UNKNOWN).join(', ')}.

For each intent category, here are the types of entities you should look for:
`;

        Object.entries(this.commandRegistry).forEach(([intentName, config]) => {
            if (intentName === IntentTypes.UNKNOWN) return;
            
            systemPrompt += `\nIntent: ${intentName}
Expected entities: ${config.entities.join(', ')}
Purpose: Use your understanding to determine if the user's input semantically matches this intent type for web UI interaction.`;
        });

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
        console.log("openai-driver.ts getLanguageName()...");
        const languageNames: { [key: string]: string } = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
            'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean',
            'ar': 'Arabic', 'hi': 'Hindi', 'nl': 'Dutch', 'sv': 'Swedish', 'da': 'Danish',
            'no': 'Norwegian', 'fi': 'Finnish', 'pl': 'Polish', 'cs': 'Czech', 'hu': 'Hungarian',
            'ro': 'Romanian', 'bg': 'Bulgarian', 'hr': 'Croatian', 'sk': 'Slovak', 'sl': 'Slovenian',
            'et': 'Estonian', 'lv': 'Latvian', 'lt': 'Lithuanian', 'mt': 'Maltese', 'ga': 'Irish',
            'cy': 'Welsh', 'eu': 'Basque', 'ca': 'Catalan', 'gl': 'Galician', 'tr': 'Turkish',
            'he': 'Hebrew', 'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay',
            'tl': 'Filipino', 'sw': 'Swahili', 'am': 'Amharic', 'yo': 'Yoruba', 'zu': 'Zulu',
            'xh': 'Xhosa', 'af': 'Afrikaans', 'sq': 'Albanian', 'az': 'Azerbaijani', 'be': 'Belarusian',
            'bn': 'Bengali', 'bs': 'Bosnian', 'my': 'Burmese', 'km': 'Khmer', 'ka': 'Georgian',
            'gu': 'Gujarati', 'kk': 'Kazakh', 'ky': 'Kyrgyz', 'lo': 'Lao', 'mk': 'Macedonian',
            'ml': 'Malayalam', 'mn': 'Mongolian', 'ne': 'Nepali', 'ps': 'Pashto', 'fa': 'Persian',
            'pa': 'Punjabi', 'si': 'Sinhala', 'ta': 'Tamil', 'te': 'Telugu', 'uk': 'Ukrainian',
            'ur': 'Urdu', 'uz': 'Uzbek'
        };
        
        return languageNames[langCode] || langCode.toUpperCase();
    }

    /**
     * Clean JSON response from potential markdown formatting
     */
    private cleanJsonResponse(content: string): string {
        console.log("openai-driver.ts cleanJsonResponse()...");
        let cleaned = content.trim();
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
        console.log("openai-driver.ts createUnknownResult()...");
        return {
            intent: IntentTypes.UNKNOWN,
            confidence: 0,
            entities: {}
        };
    }

    /**
     * Setup command registry with default commands
     */
    private setUpCommandRegistry(): void {
        console.log("openai-driver.ts setUpCommandRegistry()...");
        this.commandRegistry = {
            [IntentTypes.CLICK_ELEMENT]: {
                utterances: ["click (target)", "press (target)", "tap (target)"],
                entities: ["target"]
            },
            [IntentTypes.FILL_INPUT]: {
                utterances: ["Fill (target) as (value)", "Enter (target) as (value)", "Enter (target) with (value)", "Fill (target) with (value)"],
                entities: ["target", "value"]
            },
            [IntentTypes.SCROLL_TO_ELEMENT]: {
                utterances: ["scroll to (target)", "go to (target) section"],
                entities: ["target"]
            }
        };
    }

    /**
     * Method to change API endpoint (for testing or using compatible services)
     */
    setApiEndpoint(endpoint: string): void {
        console.log("openai-driver.ts setApiEndpoint()...");
        this.apiEndpoint = endpoint;
    }
    
    /**
     * Method to change LLM model
     */
    setModel(modelName: string): void {
        console.log("openai-driver.ts setModel()...");
        this.model = modelName;
    }

    /**
     * Get current language setting
     */
    getCurrentLanguage(): string {
        console.log("openai-driver.ts getCurrentLanguage()...");
        return this.language;
    }
}