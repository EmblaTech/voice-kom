interface NLUConfig {
    provider: string;
    model?: string;
    apiKey?: string;
    endpoint?: string;
    params?: Record<string, any>;
}