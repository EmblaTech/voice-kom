import { IntentResult, IntentTypes } from "../../types";

export interface RecognitionDriver {
    detectIntent(text: string): IntentResult | Promise<IntentResult[]>;  
    getAvailableIntents(): IntentTypes[];  
    init?(lang: string, config: any): void;
}