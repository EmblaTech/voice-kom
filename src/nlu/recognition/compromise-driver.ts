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
    private static readonly FUZZY_MATCH_SCORE_THRESHOLD = 0.5; // Adjust as needed
    private static readonly EXACT_MATCH_CONFIDENCE_THRESHOLD = 0.9; // Adjust as needed
    constructor(config: RecognitionConfig) {
        this.config = config;
        this.language = config.lang || this.language;
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

        const preprocessedText = this.preprocessInputText(text);
        const doc: CompromiseDoc = nlp(preprocessedText);

        let bestExactMatch: IntentResult | null = null;
        let bestFuzzyMatch = { score: 0, intent: IntentTypes.UNKNOWN, pattern: '' };
        
        // Define thresholds for decision making
        const EXACT_MATCH_CONFIDENCE_THRESHOLD = CompromiseRecognitionDriver.EXACT_MATCH_CONFIDENCE_THRESHOLD;
        const FUZZY_MATCH_SCORE_THRESHOLD = CompromiseRecognitionDriver.FUZZY_MATCH_SCORE_THRESHOLD;

        // === STAGE 1: Loop through all patterns and gather scores ===
        for (const intentName of Object.keys(this.commandRegistry)) {
            const commandConfig = this.commandRegistry[intentName as IntentTypes];
            if (!commandConfig) continue;

            for (const pattern of commandConfig.utterances) {
                // --- Calculate the fuzzy score for every pattern ---
                const fuzzyScore = this.getAdvancedMatchScore(preprocessedText, pattern);
                console.log(`[Fuzzy] Fuzzy score for "${pattern}" against "${preprocessedText}": ${fuzzyScore.toFixed(2)}`);
                if (fuzzyScore > bestFuzzyMatch.score) {
                    bestFuzzyMatch = {
                        score: fuzzyScore,
                        intent: intentName as IntentTypes,
                        pattern: pattern,
                    };
                }

                // --- Attempt a precise compromise match ---
                const matches: CompromiseDoc = doc.match(pattern);
                if (matches.found) {
                    const confidence = this.calculateConfidence(matches, doc);
                    if (!bestExactMatch || confidence > bestExactMatch.confidence) {
                        bestExactMatch = {
                            intent: intentName as IntentTypes,
                            confidence,
                            // Save the pattern and config for later entity extraction
                            _pattern: pattern,
                            _config: commandConfig,
                        } as any; 
                    }
                }
            }
        }
        
        // === STAGE 2: Decide which result to use ===
        
        console.log(`[Fuzzy] Best fuzzy match: ${bestFuzzyMatch.intent} with score ${bestFuzzyMatch.score.toFixed(2)}`);

        // Case 1: A high-confidence exact match was found. This is our preferred outcome.
        if (bestExactMatch && bestExactMatch.confidence >= EXACT_MATCH_CONFIDENCE_THRESHOLD) {
            const winningMatch = doc.match((bestExactMatch as any)._pattern);
            bestExactMatch.entities = this.extractEntitiesFromMatch(winningMatch, doc, (bestExactMatch as any)._config);
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
                 const entities = this.extractEntitiesFromMatch(finalMatch, correctedDoc, commandConfig);
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
    
    private extractEntitiesFromMatch(matches: CompromiseDoc, doc: any, config: CommandConfig): Entities {
        const groups = matches.groups();
        const entities: Entities = {};

        if (!config || !matches.found) {
            return {};
        }

        const matchText = matches.text();
        let matchSentenceIndex = -1;
        const anyDoc = doc as any;
        const allSentences = anyDoc.sentences().out('array'); 

        for (let i = 0; i < allSentences.length; i++) {
            if (allSentences[i].includes(matchText)) {
                matchSentenceIndex = i;
                break; 
            }
        }

        for (const groupName in groups) {
            const entityDoc = groups[groupName];
            let extractedValue = entityDoc.text('clean');

            if (config.rawEntities?.includes(groupName)) {
                extractedValue = entityDoc.text();
                if (matchSentenceIndex > -1 && matchSentenceIndex < allSentences.length - 1) {
                    const restOfText = allSentences.slice(matchSentenceIndex + 1).join(' ');
                    extractedValue += ' ' + restOfText;
                }
            }
            entities[groupName] = extractedValue.trim();
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

    // --- NEW HELPER METHODS FOR FUZZY MATCHING AND CORRECTION ---

    private parsePattern(pattern: string): { keywords: string[] } {
        // This function extracts the literal keywords from a compromise pattern.
        const keywords = pattern
            .replace(/\[?<[^>]+>.*\]?/g, '') // Remove placeholders like <name> or [<name> optional]
            .replace(/[()|]/g, ' ')          // Replace OR-group characters with spaces
            .replace(/\s\s+/g, ' ')          // Clean up multiple spaces
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
        const MIN_KEYWORD_CONFIDENCE = 0.6; // How similar a word must be to be considered a keyword match

        for (const keyword of keywords) {
            const searchString = userInput.substring(searchIndex);
            if (!searchString) return 0; // Ran out of user input to search

            const wordCandidates = searchString.split(' ');
            const { bestMatch } = findBestMatch(keyword, wordCandidates);

            if (bestMatch.rating < MIN_KEYWORD_CONFIDENCE) {
                // A required keyword was not found or was too different. This pattern is not a match.
                return 0;
            }

            cumulativeScore += bestMatch.rating;
            
            // Advance the search index past the found word to maintain order
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
            // Check if this word is a likely typo of one of our keywords
            const { bestMatch } = findBestMatch(userWord, keywords);

            // If a highly similar keyword is found, we perform a "correction"
            // The 0.5 threshold prevents correcting words that are only vaguely similar.
            if (bestMatch.rating > CompromiseRecognitionDriver.FUZZY_MATCH_SCORE_THRESHOLD) {
                correctedWords.push(bestMatch.target); // Use the correct keyword
            } else {
                correctedWords.push(userWord); // Keep the original user word
            }
        }
        return correctedWords.join(' ');
    }
}