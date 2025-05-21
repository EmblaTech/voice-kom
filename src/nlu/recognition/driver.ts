import { IntentResult } from "../../types";

export interface RecognitionDriver {
    detectIntent(text: string): IntentResult;
    getAvailableIntents(): string[];
}