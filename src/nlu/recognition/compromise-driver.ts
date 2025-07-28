import { IntentResult, IntentTypes, RecognitionConfig, Entities } from "../../types";
import { Logger } from "../../utils/logger";
import { RecognitionDriver } from "./driver";
import commands from './compromise-commands.json'; 

import nlp from 'compromise';

interface CompromiseDoc {
  text(options?: any): string;
  wordCount(): number; // Keeping for calculateConfidence
  groups(): Record<string, CompromiseDoc>;
  match(pattern: string): CompromiseDoc;
  found: boolean;
}


interface CommandConfig {
    utterances: string[];
    entities: string[];
    rawEntities?: string[]; 

}

interface CommandRegistry {
    [key:string]: CommandConfig;
}

export class CompromiseRecognitionDriver implements RecognitionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: RecognitionConfig;
    private commandRegistry: CommandRegistry | null = null;
    private availableIntents: IntentTypes[] = [IntentTypes.UNKNOWN];
    private language: string = 'en';

    private politePhrases: string[] = [
        'please', 'can you', 'could you', 'would you',
        'kindly', 'i want to', 'i would like to', 'i need to',
        'thanks', 'thank you'
    ];

    constructor(config: RecognitionConfig) {
        this.config = config;
        this.language = config.lang? config.lang.split(/[-_]/)[0].toLowerCase() : this.language;
        this.loadCommandRegistry(commands);

    }

    init(lang: string, config: RecognitionConfig): void {
        if (lang) {
            this.language = lang;
        }
    }

    public async detectIntent(text: string): Promise<IntentResult[]> {
    if (this.language !== 'en' || !this.commandRegistry) {
        return [this.createUnknownResult()];
    }

    // Keep the original text safe!
    const originalText = text; 
    const preprocessedText = this.preprocessInputText(originalText);
    const doc: CompromiseDoc = nlp(preprocessedText);

    let bestMatch: IntentResult = this.createUnknownResult();

    for (const intentName of Object.keys(this.commandRegistry)) {
        const commandConfig = this.commandRegistry[intentName as IntentTypes];
        if (!commandConfig) continue;

        for (const pattern of commandConfig.utterances) {
            const matches: CompromiseDoc = doc.match(pattern);

            if (matches.found) {
                const confidence = this.calculateConfidence(matches, doc);

                if (confidence > bestMatch.confidence) {
                    // *** CHANGE HERE: Pass the 'originalText' to the function ***
                    const entities = this.extractEntitiesFromMatch(matches, commandConfig, originalText);

                    bestMatch = {
                        intent: intentName as IntentTypes,
                        confidence,
                        entities,
                    };
                }
            }
        }
    }
    
    return [bestMatch];
}

    public getAvailableIntents(): IntentTypes[] {
        return this.availableIntents;
    }

    private loadCommandRegistry(registry: CommandRegistry): void {
        this.commandRegistry = registry;

        // Automatically build the available intents list from the loaded JSON
        this.availableIntents = [
            ...Object.keys(this.commandRegistry) as IntentTypes[],
            IntentTypes.UNKNOWN,
        ];
    }

    private preprocessInputText(text: string): string {
    let cleanedText = text.toLowerCase().trim();

    // Improved Regex:
    // It looks for a polite phrase at the start of the string, followed by one or more spaces
    // OR
    // one or more spaces followed by a polite phrase at the end of the string.
    const politeWords = this.politePhrases.join('|');
    const regex = new RegExp(`^(${politeWords})\\s+|\\s+(${politeWords})$`, 'ig');
    
    // Replace multiple times in case of phrases at both start and end
    cleanedText = cleanedText.replace(regex, '').replace(regex, ''); 

    // Remove any remaining leading/trailing punctuation and trim again
    cleanedText = cleanedText.replace(/^[.,!?]+|[.,!?]+$/g, '').trim();
    
    return cleanedText;
}
    
    // 2. Update the helper function signatures to use our new interface
//     private extractEntitiesFromMatch(matches: CompromiseDoc, config: CommandConfig): Entities {
//     const groups = matches.groups();
//     const entities: Entities = {};

//     for (const groupName in groups) {
//         const entityDoc = groups[groupName];

//         // GENERALIZED LOGIC:
//         // Check if the 'rawEntities' array exists in the config AND
//         // if the current entity's name is in that array.
//         if (config.rawEntities?.includes(groupName)) {
//             // If yes, use the raw .text() method.
//             entities[groupName] = entityDoc.text();
//         } else {
//             // Otherwise, use the default clean extraction.
//             entities[groupName] = entityDoc.text('clean');
//         }
//     }

//     return entities;
// }

    /**
 * Extracts entities from a match using precise character offsets to get the original, raw text.
 * @param matches The CompromiseDoc object for the matched pattern.
 * @param config The configuration for the matched command.
 * @param originalText The original, unprocessed user input string.
 * @returns An Entities object with raw text values.
 */
private extractEntitiesFromMatch(matches: CompromiseDoc, config: CommandConfig, originalText: string): Entities {
    const groups = matches.groups();
    const entities: Entities = {};

    for (const groupName in groups) {
        if (!Object.prototype.hasOwnProperty.call(groups, groupName)) {
            continue;
        }
        
        const entityDoc = groups[groupName];

        // Use compromise's json output with offsets to get the exact location.
        // We cast to `any` because our custom interface doesn't include the `json` method.
        const jsonData = (entityDoc as any).json({ offset: true });

        // Ensure we have valid data to work with
        if (!jsonData || !jsonData[0] || !jsonData[0].terms || jsonData[0].terms.length === 0) {
            // Fallback to the previous method if offsets aren't available for some reason
            entities[groupName] = entityDoc.text(); 
            continue;
        }

        const terms = jsonData[0].terms;
        const firstTerm = terms[0];
        const lastTerm = terms[terms.length - 1];

        // Calculate the start and end positions from the offsets.
        const start = firstTerm.offset.start;
        const end = lastTerm.offset.start + lastTerm.offset.length;

        // Slice the *original, unprocessed text* to get the true raw entity.
        const rawEntityText = originalText.slice(start, end);
        
        // This is exactly what you asked for: setting the entity to the raw text.
        // The special logic for `rawEntities` is no longer needed because this method is superior.
        entities[groupName] = rawEntityText;
    }

    return entities;
}
    // 3. Update the helper function signatures to use our new interface
    private calculateConfidence(match: CompromiseDoc, doc: CompromiseDoc): number {
        const matchLength = match.text().length;
        const totalLength = doc.text().length;

        if (totalLength === 0) return 0;

        const coverage = matchLength / totalLength;
        const specificityBonus = Math.min(match.wordCount() / 10, 0.2);

        return Math.min(coverage + specificityBonus, 1.0);
    }

    private createUnknownResult(): IntentResult {
        return {
            intent: IntentTypes.UNKNOWN,
            confidence: 0,
            entities: {}
        };
    }
}