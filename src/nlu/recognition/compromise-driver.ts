import { IntentResult, IntentTypes, RecognitionConfig, Entities } from "../../types";
import { Logger } from "../../utils/logger";
import { RecognitionDriver } from "./driver";
import commands from './compromise-commands.json'; 

import nlp from 'compromise';
// Import the necessary function from the string-similarity library
import { findBestMatch } from 'string-similarity';

// Interfaces remain unchanged
interface CompromiseDoc {
  text(options?: any): string;
  wordCount(): number;
  groups(): any; // Accept any type to match compromise's actual return type
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
    private static readonly FUZZY_MATCH_SCORE_THRESHOLD = 0.5;
    private static readonly EXACT_MATCH_CONFIDENCE_THRESHOLD = 0.9;
    
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

        // Keep the original text safe for raw entity extraction!
        const originalText = text; 
        const preprocessedText = this.preprocessInputText(originalText);
        const doc: CompromiseDoc = nlp(preprocessedText);

        let bestExactMatch: IntentResult | null = null;
        let bestFuzzyMatch = { score: 0, intent: IntentTypes.UNKNOWN, pattern: '' };
        
        const EXACT_MATCH_CONFIDENCE_THRESHOLD = CompromiseRecognitionDriver.EXACT_MATCH_CONFIDENCE_THRESHOLD;
        const FUZZY_MATCH_SCORE_THRESHOLD = CompromiseRecognitionDriver.FUZZY_MATCH_SCORE_THRESHOLD;

        // === STAGE 1: Loop through all patterns and gather scores ===
        for (const intentName of Object.keys(this.commandRegistry)) {
            const commandConfig = this.commandRegistry[intentName as IntentTypes];
            if (!commandConfig) continue;

            for (const pattern of commandConfig.utterances) {
                const fuzzyScore = this.getAdvancedMatchScore(preprocessedText, pattern);
                if (fuzzyScore > bestFuzzyMatch.score) {
                    bestFuzzyMatch = {
                        score: fuzzyScore,
                        intent: intentName as IntentTypes,
                        pattern: pattern,
                    };
                }

                const matches: CompromiseDoc = doc.match(pattern);
                if (matches.found) {
                    const confidence = this.calculateConfidence(matches, doc);
                    if (!bestExactMatch || confidence > bestExactMatch.confidence) {
                        bestExactMatch = {
                            intent: intentName as IntentTypes,
                            confidence,
                            _pattern: pattern,
                            _config: commandConfig,
                        } as any; 
                    }
                }
            }
        }
        
        // === STAGE 2: Decide which result to use ===
        
        // Case 1: A high-confidence exact match was found. This is our preferred outcome.
        if (bestExactMatch && bestExactMatch.confidence >= EXACT_MATCH_CONFIDENCE_THRESHOLD) {
            const winningMatch = doc.match((bestExactMatch as any)._pattern);
            
            // *** CHANGE 1: Pass `originalText` to get raw entities for exact matches ***
            bestExactMatch.entities = this.extractEntitiesFromMatch(
                winningMatch, 
                (bestExactMatch as any)._config, 
                originalText // Use the unprocessed text for perfect extraction
            );

            delete (bestExactMatch as any)._pattern;
            delete (bestExactMatch as any)._config;
            return [bestExactMatch];
        }
        
        // Case 2: No great exact match, but we have a good fuzzy match candidate.
        if (bestFuzzyMatch.score >= FUZZY_MATCH_SCORE_THRESHOLD) {
            this.logger.info(`[Fuzzy] No exact match. Using fuzzy fallback for intent: ${bestFuzzyMatch.intent} with score ${bestFuzzyMatch.score.toFixed(2)}`);

            const correctedText = this.correctInputText(preprocessedText, bestFuzzyMatch.pattern);
            this.logger.info(`[Fuzzy] Original: "${preprocessedText}" | Corrected: "${correctedText}"`);
            
            const correctedDoc = nlp(correctedText);
            const finalMatch = correctedDoc.match(bestFuzzyMatch.pattern);
            const commandConfig = this.commandRegistry[bestFuzzyMatch.intent];

            if (finalMatch.found && commandConfig) {
                 // *** CHANGE 2: Pass `correctedText` as the source for fuzzy matches ***
                 const entities = this.extractEntitiesFromMatch(
                     finalMatch, 
                     commandConfig, 
                     correctedText // Offsets will be relative to the corrected text
                 );

                 return [{
                    intent: bestFuzzyMatch.intent,
                    confidence: bestFuzzyMatch.score,
                    entities,
                 }];
            }
        }
        
        // Case 3: No high-quality match was found by either method.
        this.logger.info('[Fuzzy] No suitable exact or fuzzy match found.');
        return [this.createUnknownResult()];
    }

    public getAvailableIntents(): IntentTypes[] {
        return this.availableIntents;
    }

    private loadCommandRegistry(registry: CommandRegistry): void {
        this.commandRegistry = registry;
        this.availableIntents = [
            ...Object.keys(this.commandRegistry) as IntentTypes[],
            IntentTypes.UNKNOWN,
        ];
    }

    private preprocessInputText(text: string): string {
        let cleanedText = text.toLowerCase().trim();
        const politeWords = this.politePhrases.join('|');
        const regex = new RegExp(`^(${politeWords})\\s+|\\s+(${politeWords})$`, 'ig');
        cleanedText = cleanedText.replace(regex, '').replace(regex, ''); 
        cleanedText = cleanedText.replace(/^[.,!?]+|[.,!?]+$/g, '').trim();
        return cleanedText;
    }
    
    // *** CHANGE 3: Replaced the old function with the new, superior offset-based method ***
    /**
     * Extracts entities from a match using precise character offsets to get the original, raw text.
     * @param matches The CompromiseDoc object for the matched pattern.
     * @param config The configuration for the matched command.
     * @param sourceText The text the `matches` were found in (can be original or corrected text).
     * @returns An Entities object with raw text values.
     */
    private extractEntitiesFromMatch(matches: CompromiseDoc, config: CommandConfig, sourceText: string): Entities {
        const groups = matches.groups();
        const entities: Entities = {};

        if (!config || !matches.found) {
            return {};
        }

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
                entities[groupName] = entityDoc.text(); // Fallback for safety
                continue;
            }

            const terms = jsonData[0].terms;
            const firstTerm = terms[0];
            const lastTerm = terms[terms.length - 1];

            // Calculate the start and end positions from the offsets.
            const start = firstTerm.offset.start;
            const end = lastTerm.offset.start + lastTerm.offset.length;

            // Slice the source text to get the true raw entity.
            // This will be originalText for exact matches, and correctedText for fuzzy ones.
            const rawEntityText = sourceText.slice(start, end);
            
            entities[groupName] = rawEntityText;
        }

        return entities;
    }
    
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

    // --- Helper methods for Fuzzy Matching and Correction ---

    private parsePattern(pattern: string): { keywords: string[] } {
        const keywords = pattern
            .replace(/\[?<[^>]+>.*\]?/g, '') 
            .replace(/[()|]/g, ' ')          
            .replace(/\s\s+/g, ' ')          
            .trim()
            .split(' ');
        return { keywords };
    }

    private getAdvancedMatchScore(userInput: string, pattern: string): number {
        const { keywords } = this.parsePattern(pattern);
        if (keywords.length === 0 || keywords[0] === '') {
            return 0.5;
        }

        let cumulativeScore = 0;
        let searchIndex = 0;
        const MIN_KEYWORD_CONFIDENCE = 0.6;

        for (const keyword of keywords) {
            const searchString = userInput.substring(searchIndex);
            if (!searchString) return 0;

            const wordCandidates = searchString.split(' ');
            const { bestMatch } = findBestMatch(keyword, wordCandidates);

            if (bestMatch.rating < MIN_KEYWORD_CONFIDENCE) {
                return 0;
            }

            cumulativeScore += bestMatch.rating;
            
            const absoluteMatchIndex = userInput.indexOf(bestMatch.target, searchIndex);
            searchIndex = absoluteMatchIndex + bestMatch.target.length;
        }

        return cumulativeScore / keywords.length;
    }
    
    private correctInputText(userInput: string, pattern: string): string {
        const { keywords } = this.parsePattern(pattern);
        if (keywords.length === 0 || keywords[0] === '') return userInput;

        const userInputWords = userInput.split(' ');
        const correctedWords: string[] = [];

        for (const userWord of userInputWords) {
            const { bestMatch } = findBestMatch(userWord, keywords);
            if (bestMatch.rating > CompromiseRecognitionDriver.FUZZY_MATCH_SCORE_THRESHOLD) {
                correctedWords.push(bestMatch.target);
            } else {
                correctedWords.push(userWord);
            }
        }
        return correctedWords.join(' ');
    }
}