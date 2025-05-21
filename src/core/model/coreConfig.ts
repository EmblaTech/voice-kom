import { RecognitionConfig, TranscriptionConfig } from "../../types";

export interface CoreConfig {
    transcriptionConfig: TranscriptionConfig; 
    recognitionConfig: RecognitionConfig;
    uiConfig: UIConfig
    actuatorConfig: ActuatorConfig
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