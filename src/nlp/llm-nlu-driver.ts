import { injectable, inject } from 'inversify';
// Import the updated types from your file
import { 
  INLUDriver, 
  IntentResult, 
  IntentTypes, 
  TYPES,
} from '../types'; 

import { NLUEngineConfig } from './model/nlpConfig';
// Assuming ICommandRegistry is an interface for your command registry object
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

  public init(lang: string, config: NLUEngineConfig): void {
    this.language = lang || 'en';
    if (!config.nluApiKey) {
      throw new Error('LLM API key is required for LLM-based NLU');
    }
    this.apiKey = config.nluApiKey;
    this.commandRegistry = this.registryService;
    this.setupIntentsAndEntities();
  }

  private setupIntentsAndEntities(): void {
    if (!this.commandRegistry) return;
    // Assuming commandRegistry is an object where keys are intent names
    this.availableIntents = Object.keys(this.commandRegistry) as IntentTypes[];
    if (!this.availableIntents.includes(IntentTypes.UNKNOWN)) {
      this.availableIntents.push(IntentTypes.UNKNOWN);
    }
  }

  private generateSystemPrompt(): string {
    if (!this.commandRegistry) return '';
    
    let systemPrompt = `You are an expert intent classification system for a voice-controlled web UI. Your goal is to analyze user commands and return a structured JSON array of intents and entities.

The user is speaking in ${this.getLanguageName(this.language)}.

You must identify intents from the following list: ${this.availableIntents.filter(i => i !== IntentTypes.UNKNOWN).join(', ')}.
`;

    Object.entries(this.commandRegistry).forEach(([intentName, config]) => {
      if (intentName === IntentTypes.UNKNOWN || !config.entities) return;
      systemPrompt += `\n- For the "${intentName}" intent, you can extract these entities: ${config.entities.join(', ')}.`;
    });

    systemPrompt += `

### IMPORTANT: Multiple Intent Detection ###
A single user command can contain MULTIPLE intents. For example:
- "Fill name with John, email with john@example.com, and phone with 123456" should return 3 separate intents
- "Click submit and then navigate to home" should return 2 separate intents
- "My name is Nisal, email is nisal@gmail.com, phone number is 074321, fill those" should return 3 fill intents

### JSON Response Format Instructions ###
You MUST respond with a JSON array. Each object in the array represents a detected intent and must contain:
1. "intent": The identified intent name (e.g., "fill_input").
2. "confidence": A number from 0 to 1.
3. "entities": A JSON object of extracted entities.

### Entity Extraction Rules ###
This is the most important rule. How you format entities depends on their type:

1.  **UI Element Entities (e.g., 'target', 'targetgroup', 'group'):**
    For any entity that represents an element on the webpage (like a button, link, or input field), you MUST return an object with two keys:
    - "english": The English, lowercase, simplified version of the entity. If user speaks it in english, keep it as it is. If not translate it to english.
    - "user_language": The entity translated/expressed in ${this.getLanguageName(this.language)} (the user's configured language). If user speaks it in english, You still need to normalize to  ${this.getLanguageName(this.language)} language. 
    
    **IMPORTANT - Mixed Language Handling:**
    Even if the user speaks the entity name in mixed-english or similar to english while primarily speaking ${this.getLanguageName(this.language)}, you MUST still provide the proper translation in the user_language field.
    
    Examples:
    - User says "phone number" while speaking Norwegian: 
      {"english": "phone number", "user_language": "telefonnummer"}
    - User says "email" while speaking Spanish:
      {"english": "email", "user_language": "epost"}
    - User says "submit button" while speaking German:
      {"english": "submit", "user_language": "senden"}


2.  **Value Entities (e.g., 'value', 'direction'):**
    For entities that represent data values:
    - If the value is for typing/entering text: Return exactly as the user said it (preserve original language/form)
    - If the value represents direction, time, or date: Normalize to English for system processing since I use english word parsing
    Examples:
    - Text to type: "mejor precio" (keep original)
    - Direction: "up", "down", "left", "right", "next", "previous" (normalize to English)
    - Position: "top", "bottom"(normalize to English)
    - Time:  "now", "3pm", "15:30" (normalize to English)
    - Date: "today", "tomorrow", "2024-01-15" (normalize to English)

### Multiple Intent Example ###
User command: "My name is Nisal, email is nisal@gmail.com, phone number is 074321, fill those"
(Assuming user's configured language is English)

Your JSON response should be:
[
  {
    "intent": "fill_input",
    "confidence": 0.95,
    "entities": {
      "target": {
        "english": "name",
        "user_language": "name"
      },
      "value": "Nisal"
    }
  },
  {
    "intent": "fill_input",
    "confidence": 0.95,
    "entities": {
      "target": {
        "english": "email",
        "user_language": "email"
      },
      "value": "nisal@gmail.com"
    }
  },
  {
    "intent": "fill_input",
    "confidence": 0.95,
    "entities": {
      "target": {
        "english": "phone",
        "user_language": "phone number"
      },
      "value": "074321"
    }
  }
]

### Final Instruction ###
Analyze the user's command carefully, identify ALL intents present in the command, apply these rules, and return ONLY the raw JSON array. Do not include any markdown formatting like \`\`\`json or explanations.`;

    return systemPrompt;
  }

  public async identifyIntent(text: string): Promise<IntentResult[]> {
    if (!this.apiKey) throw new Error('LLM API key is required');
    
    try {
      const systemPrompt = this.generateSystemPrompt();
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
          temperature: 0.1,
          // REMOVED: response_format: { type: "json_object" } - This was forcing single object instead of array
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LLM API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const cleanedContent = this.cleanJsonResponse(content);
        const results = JSON.parse(cleanedContent);
        
        // Ensure we always return an array
        const resultsArray = Array.isArray(results) ? results : [results];
        
        return resultsArray.map(result => ({
          intent: result.intent || IntentTypes.UNKNOWN,
          confidence: result.confidence || 0,
          entities: result.entities || {}
        }));
      } catch (parseError) {
        console.error('Error parsing LLM JSON response:', parseError, 'Raw content:', content);
        return [this.createUnknownResult()];
      }
    } catch (error) {
      console.error('Error during LLM intent identification:', error);
      return [this.createUnknownResult()];
    }
  }

  private cleanJsonResponse(content: string): string {
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
  }

  private createUnknownResult(): IntentResult {
    return { intent: IntentTypes.UNKNOWN, confidence: 0, entities: {} };
  }

  private getLanguageName(langCode: string): string {
    // ... same implementation as before
    const languageNames = new Map([['en', 'English'], ['es', 'Spanish']]);
    return languageNames.get(langCode) || langCode.toUpperCase();
  }
  
  public getAvailableIntents(): IntentTypes[] { return this.availableIntents; }
}