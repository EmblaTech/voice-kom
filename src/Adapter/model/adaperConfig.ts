export interface AdapterConfig {  
    container: HTMLElement;
    lang?: string;

    //Speech to text provider options
    sttEngine?: string;
    sttApiKey?: string;
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