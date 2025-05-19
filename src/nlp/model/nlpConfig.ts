export interface NLPConfig{
    lang?:string;
    sst?:STTConfig;
    nlu?:NLUEngineConfig
}

export interface STTConfig{
    sttEngine: string;
    sttApiKey?: string;
    speechEngineParams?: Record<string, any>;
}

export interface NLUEngineConfig{
    nluEngine: string;
    nluApiKey?: string;
}