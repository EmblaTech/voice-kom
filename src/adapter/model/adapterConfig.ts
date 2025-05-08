interface AdapterConfig {  
    containerId?: string;
    lang?: string;

    //Speech to text provider options
    speechEngine?: string;
    speechApiKey?: string;
    speechConfidence?: number;
    speechEngineParams?: Record<string, any>;
    
    //UI options
    autoStart?: boolean;
    position?: string;
    width?: number | string;
    height?: number | string;
    theme?: string;
    showProgress?: boolean;
    showTranscription?: boolean;
    styles?: Record<string, string>;

    //Other options
    retryAttempts?: number;
    timeout?: number;
}