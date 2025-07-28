import { IntentResult, IntentTypes } from "../../types";

export interface RecognitionDriver {
    detectIntent(text: string): Promise<IntentResult[]>;  
    getAvailableIntents(): IntentTypes[];  
    init?(lang: string, config: any): void;
}