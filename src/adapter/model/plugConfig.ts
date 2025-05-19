export interface SpeechPlugConfig {
    transcription: any;
    nlu: any;  
    //Key configs
    containerId? :string;
    lang?: string;   

    //Speech engine configs
    transcriptionProvider?: SpeechProviderConfig;  //Transcription options
    recognitionProvider?: SpeechProviderConfig; // NLU options    

    //UI configs
    ui?: UIConfig; 
    
    //Other configs
    retries?: number; 
    timeout?: number;
}

interface SpeechProviderConfig {
    name?: string; // Provider name (e.g., 'default' | 'openai' | 'google' | 'azure' | 'custom',)
    apiUrl?: string;  // API endpoint URL 
    apiKey?: string; // API key if required  
    model?: string;  // Model name if applicable
    confidence?: number; // Confidence threshold (0.0-1.0)    
    options?: Record<string, any>; // Any additional options needed
}

interface UIConfig {
    autoStart?: boolean;
    position?: string;
    width?: number | string;
    height?: number | string;
    theme?: string;
    showProgress?: boolean;
    showTranscription?: boolean;
    styles?: Record<string, string>;
}
