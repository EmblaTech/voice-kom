interface SpeechEngineOptions {
    name: string;
    model?: string;
    apiKey?: string;
    confidence?: number;
    params?: Record<string, any>;
}