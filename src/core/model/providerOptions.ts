interface SpeechToTextProviderOptions {
    name: string;
    apiKey?: string;
    endpoint?: string;
    confidence?: number;
    params?: Record<string, any>;
}