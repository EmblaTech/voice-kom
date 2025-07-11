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

//TODO: Need to set producition server URL
//const DEFAULT_SERVER_URL = 'https://api.speechplug.com'; // real production backend URL
const DEFAULT_SERVER_URL = '';

export class OpenAIRecognitionDriver implements RecognitionDriver {
    private readonly logger = Logger.getInstance();
    private language: string;
    private commandRegistry: CommandRegistry;
    private availableIntents: IntentTypes[] = [IntentTypes.UNKNOWN];
    //private apiKey: string;
    //private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
    private model: string = 'gpt-4o';
    private backEndpoint!: string;
    private clientId!: string;

    private static readonly DEFAULT_TEMPERATURE = 0.3;
    private static readonly DEFAULT_LANGUAGE = 'en';
 
    private static readonly LANGUAGE_NAMES: Record<string, string> = {
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

    constructor(config: RecognitionConfig, clientId: any, serverUrl: any) {
        this.logger.info('Initializing OpenAI Recognition Driver', { config });
        this.validateConfig(config, clientId);       
        this.language = config.lang || OpenAIRecognitionDriver.DEFAULT_LANGUAGE;
        //this.apiKey = config.apiKey!;
        //this.apiEndpoint = config.apiUrl || this.apiEndpoint;
        this.model = config.model || this.model;
        this.clientId = clientId;
        this.backEndpoint = serverUrl || DEFAULT_SERVER_URL;
        this.commandRegistry = this.createDefaultCommandRegistry();
        this.availableIntents = this.extractAvailableIntents();
        
        this.logger.info('OpenAI Recognition Driver initialized successfully', {
            language: this.language,
            model: this.model,
            intentCount: this.availableIntents.length
        });
    }

    /**
     * Detect intent from input text using OpenAI LLM
     */
    async detectIntent(text: string): Promise<IntentResult[]> {
        this.logger.info('Starting intent detection', { text, language: this.language });
        
        this.validateInput(text);
        
        try {
            const response = await this.makeApiRequest(text);
            const results = await this.parseApiResponse(response);
            
            this.logger.info('Intent detection completed successfully', { 
                resultsCount: results.length,
                intents: results.map(r => r.intent)
            });
            
            return results;
        } catch (error) {
            this.logger.error('Intent detection failed', { error, text });
            return [this.createUnknownResult()];
        }
    }

    /**
     * Get available intent types
     */
    getAvailableIntents(): IntentTypes[] {
        return [...this.availableIntents];
    }

    /**
     * Update the command registry
     */
    setCommandRegistry(registry: CommandRegistry): void {
        this.logger.info('Updating command registry', { 
            oldIntentCount: this.availableIntents.length,
            newIntentCount: Object.keys(registry).length
        });
        
        this.commandRegistry = { ...registry };
        this.availableIntents = this.extractAvailableIntents();
    }

    /**
     * Update API endpoint
     */
    // setApiEndpoint(endpoint: string): void {
    //     if (!this.isValidUrl(endpoint)) {
    //         throw new Error(`Invalid API endpoint: ${endpoint}`);
    //     }
        
    //     this.logger.info('Updating API endpoint', { 
    //         oldEndpoint: this.apiEndpoint, 
    //         newEndpoint: endpoint 
    //     });
        
    //     this.apiEndpoint = endpoint;
    // }

    /**
     * Update LLM model
     */
    setModel(modelName: string): void {
        if (!modelName?.trim()) {
            throw new Error('Model name cannot be empty');
        }
        
        this.logger.info('Updating model', { 
            oldModel: this.model, 
            newModel: modelName 
        });
        
        this.model = modelName;
    }

    /**
     * Update language setting
     */
    setLanguage(language: string): void {
        if (!language?.trim()) {
            throw new Error('Language cannot be empty');
        }
        
        this.logger.info('Updating language', { 
            oldLanguage: this.language, 
            newLanguage: language 
        });
        
        this.language = language;
    }

    /**
     * Get current language setting
     */
    getCurrentLanguage(): string {
        return this.language;
    }

    /**
     * Get current model setting
     */
    getCurrentModel(): string {
        return this.model;
    }

    private validateConfig(config: RecognitionConfig, clientId: any): void {
        // if (!config.apiKey?.trim()) {
        //     throw new Error('OpenAI API key is required for LLM-based NLU');
        // }

        if (config.apiUrl && !this.isValidUrl(config.apiUrl)) {
            throw new Error(`Invalid API URL provided: ${config.apiUrl}`);
        }

        if (!clientId) {
            throw new Error("clientId must be provided in the configuration!");
        }
    }

    private validateInput(text: string): void {
        if (!text?.trim()) {
            throw new Error('Input text cannot be empty for intent detection');
        }
    }

    private async makeApiRequest(text: string): Promise<Response> {
        const systemPrompt = this.generateSystemPrompt();
        const userMessage = this.formatUserMessage(text);
        
        const requestBody = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: OpenAIRecognitionDriver.DEFAULT_TEMPERATURE
        };

        this.logger.debug('Making OpenAI API request', { 
            model: this.model,
            messageLength: userMessage.length
        });

        const response = await fetch(`${this.backEndpoint}/api/execute/openai-recognize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': this.clientId
            },
            body: JSON.stringify(requestBody)
        }); 
        
        if (!response.ok) {
            await this.handleApiError(response);
        }

        return response;
    }

    private async parseApiResponse(response: Response): Promise<IntentResult[]> {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('Invalid API response: missing content');
        }

        try {
            const cleanedContent = this.cleanJsonResponse(content);
            const results = JSON.parse(cleanedContent);
            
            return this.normalizeResults(results);
        } catch (parseError) {
            this.logger.error('Failed to parse OpenAI response', { 
                error: parseError, 
                rawContent: content 
            });
            throw new Error('Failed to parse intent detection response');
        }
    }

    private async handleApiError(response: Response): Promise<never> {
        try {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || 'Unknown API error';
            throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
        } catch {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
    }

    private normalizeResults(results: any): IntentResult[] {
        if (!Array.isArray(results)) {
            if (results?.intent) {
                return [this.createIntentResult(results)];
            }
            return [this.createUnknownResult()];
        }

        return results.map(result => this.createIntentResult(result));
    }

    private createIntentResult(result: any): IntentResult {
        return {
            intent: result.intent || IntentTypes.UNKNOWN,
            confidence: Math.max(0, Math.min(1, result.confidence || 0)),
            entities: result.entities || {}
        };
    }

    private formatUserMessage(text: string): string {
        return this.language !== OpenAIRecognitionDriver.DEFAULT_LANGUAGE
            ? `Input language: ${this.getLanguageName(this.language)}\nUser command: ${text}`
            : text;
    }

    private generateSystemPrompt(): string {
        if (!this.commandRegistry || Object.keys(this.commandRegistry).length === 0) {
            throw new Error('Command registry is empty or not initialized');
        }

        const languageInstruction = this.buildLanguageInstruction();
        const intentCategories = this.buildIntentCategories();
        const entityInstructions = this.buildEntityInstructions();
        const multilingualInstructions = this.buildMultilingualInstructions();
        const classificationInstructions = this.buildClassificationInstructions();

        return `You are an advanced intent classification system with full autonomy to understand and interpret user commands for web UI interactions. Your task is to intelligently identify all possible intents from the user's speech input and extract relevant entities for each intent.

${languageInstruction}${intentCategories}

${entityInstructions}${multilingualInstructions}

${classificationInstructions}`;
    }

    private buildLanguageInstruction(): string {
        return this.language !== OpenAIRecognitionDriver.DEFAULT_LANGUAGE
            ? `The user input will be in ${this.getLanguageName(this.language)}. You should understand the meaning of the input in that language and match it to the appropriate English command intents listed below. Focus on the semantic meaning rather than exact word matching.\n\n`
            : '';
    }

    private buildIntentCategories(): string {
        const validIntents = this.availableIntents.filter(i => i !== IntentTypes.UNKNOWN);
        return `You have access to the following intent categories: ${validIntents.join(', ')}.`;
    }

    private buildEntityInstructions(): string {
        let instructions = '\nFor each intent category, here are the types of entities you should look for:\n';
        
        Object.entries(this.commandRegistry).forEach(([intentName, config]) => {
            if (intentName === IntentTypes.UNKNOWN) return;
            
            instructions += `\nIntent: ${intentName}
Expected entities: ${config.entities.join(', ')}
Purpose: Use your understanding to determine if the user's input semantically matches this intent type for web UI interaction.`;
        });
        
        return instructions;
    }

    private buildMultilingualInstructions(): string {
        return this.language !== OpenAIRecognitionDriver.DEFAULT_LANGUAGE
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
    }

    private buildClassificationInstructions(): string {
        return `INSTRUCTIONS FOR INTENT CLASSIFICATION:
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
    }

    private getLanguageName(langCode: string): string {
        return OpenAIRecognitionDriver.LANGUAGE_NAMES[langCode] || langCode.toUpperCase();
    }

    private cleanJsonResponse(content: string): string {
        const cleaned = content.trim();
        const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)```$/;
        const match = cleaned.match(codeBlockRegex);
        
        return match ? match[1].trim() : cleaned;
    }

    private createUnknownResult(): IntentResult {
        return {
            intent: IntentTypes.UNKNOWN,
            confidence: 0,
            entities: {}
        };
    }

    private createDefaultCommandRegistry(): CommandRegistry {
        return {
            [IntentTypes.CLICK_ELEMENT]: {
                utterances: ["click (target)", "press (target)", "tap (target)"],
                entities: ["target"]
            },
            [IntentTypes.FILL_INPUT]: {
                utterances: [
                    "Fill (target) as (value)", 
                    "Enter (target) as (value)", 
                    "Enter (target) with (value)", 
                    "Fill (target) with (value)"
                ],
                entities: ["target", "value"]
            },
            [IntentTypes.SCROLL_TO_ELEMENT]: {
                utterances: ["scroll to (target)", "go to (target) section"],
                entities: ["target"]
            }
        };
    }

    private extractAvailableIntents(): IntentTypes[] {
        const intents = Object.keys(this.commandRegistry) as IntentTypes[];
        
        if (!intents.includes(IntentTypes.UNKNOWN)) {
            intents.push(IntentTypes.UNKNOWN);
        }
        
        return intents;
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}