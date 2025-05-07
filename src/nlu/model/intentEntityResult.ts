export interface IntentEntityResult {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    rawText: string;
    alternatives?: Array<{
        intent: string;
        confidence: number;
        entities?: Record<string, any>;
    }>;
    metadata?: Record<string, any>;
}