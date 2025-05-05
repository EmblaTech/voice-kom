interface AdapterOptions {  
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
    styles?: Record<string, string>;
}