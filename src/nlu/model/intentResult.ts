export interface IntentResult {
    intent: string;
    confidence: number;
    alternatives?: Array<{
        intent: string;
        confidence: number;
    }>;
}