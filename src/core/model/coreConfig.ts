export interface CoreConfig {
    nluConfig?:NLUConfig;
    uiConfig: UIConfig
    actuatorConfig?: ActuatorConfig
}

interface NLUConfig {
    transcriptionProvider?: TranscriptionProviderConfig; 
    recognitionProvider?: RecongnitionProviderConfig; 
}
interface TranscriptionProviderConfig {
    name?: string; 
    lang?: string;
    apiUrl?: string;  
    apiKey?: string; 
    model?: string;  
    confidence?: number; 
    options?: Record<string, any>; 
}

interface RecongnitionProviderConfig {
    name?: string; 
    lang?: string;
    apiUrl?: string;  
    apiKey?: string; 
    model?: string;  
    confidence?: number; 
    options?: Record<string, any>; 
}

interface UIConfig {
    containerId?: string;
    autoStart?: boolean;
    position?: string;
    width?: string;
    height?: string;
    theme?: string;
    showProgress?: boolean;
    showTranscription?: boolean;
    styles?: Record<string, string>;
}

interface ActuatorConfig {
    retries?:number,
    timeout?: number,
}