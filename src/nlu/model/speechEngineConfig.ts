export interface SpeechEngineConfig {
    type: string;
    transcribeModel?: string;
    intentModel?: string;
    entityRecognitionModel?: string;
    apiKey?: string;
    confidence?: number;
    params?: Record<string, any>;
}