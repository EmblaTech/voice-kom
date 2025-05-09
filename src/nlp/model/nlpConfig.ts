export interface NLPConfig{
    lang?:string;
    sst?:SSTEngineConfig;
    nlu?:NLUEngineConfig
}

export interface SSTEngineConfig{
    sttEngine: string;
    sttApiKey?: string;
    speechEngineParams?: Record<string, any>;
}

export interface NLUEngineConfig{
    nluEngine: string;
    nluApiKey?: string;
}