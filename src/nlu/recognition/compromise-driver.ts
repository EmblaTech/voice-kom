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
        // Because the function is async, this is automatically wrapped in a Promise
        return [this.createUnknownResult()];
    }

    const preprocessedText = this.preprocessInputText(text);
    const doc: CompromiseDoc = nlp(preprocessedText);

    let bestMatch: IntentResult = this.createUnknownResult();

    for (const intentName of Object.keys(this.commandRegistry)) {
        const commandConfig = this.commandRegistry[intentName as IntentTypes];
        if (!commandConfig) continue;

        for (const pattern of commandConfig.utterances) {
            // Use the more robust capture syntax
            const matches: CompromiseDoc = doc.match(pattern);

            if (matches.found) {
                const confidence = this.calculateConfidence(matches, doc);

                if (confidence > bestMatch.confidence) {
                    const entities = this.extractEntitiesFromMatch(matches, doc, commandConfig);

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

    private extractEntitiesFromMatch(matches: CompromiseDoc, doc: any, config: CommandConfig): Entities {
    const groups = matches.groups();
    const entities: Entities = {};

    // Get the raw text of the match to check for it later.
    const matchText = matches.text();
    let matchSentenceIndex = -1;

    // Cast the full document to `any` to access Compromise's full API without compiler errors.
    // This is a safe and common practice when a library's types are complex.
    const anyDoc = doc as any;
    const allSentences = anyDoc.sentences().out('array'); // Get a plain JavaScript array of sentence strings

    // Find the index of the sentence that contains our match
    for (let i = 0; i < allSentences.length; i++) {
        if (allSentences[i].includes(matchText)) {
            matchSentenceIndex = i;
            break; // Stop once we find the first occurrence
        }
    }

    for (const groupName in groups) {
        const entityDoc = groups[groupName];
        let extractedValue = entityDoc.text('clean');

        if (config.rawEntities?.includes(groupName)) {
            extractedValue = entityDoc.text();

            // If we found the sentence and it's not the last one...
            if (matchSentenceIndex > -1 && matchSentenceIndex < allSentences.length - 1) {
                // Get the rest of the sentences as a simple array and join them.
                const restOfText = allSentences.slice(matchSentenceIndex + 1).join(' ');
                extractedValue += ' ' + restOfText;
            }
        }
        
        entities[groupName] = extractedValue.trim();
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