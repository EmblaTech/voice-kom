// enhanced-types.ts
export interface SpeechPlugConfig {
  //Key configs
  containerId? :string;
  lang?: string;   

  //Speech engine configs
  transcription?: TranscriptionConfig;  //Transcription options
  recognition?: RecognitionConfig; // NLU options    

  //UI configs
  autoStart?: boolean;
  position?: string;
  width?: string;
  height?: string;
  theme?: string;
  showProgress?: boolean;
  showTranscription?: boolean;
  styles?: Record<string, string>;
  
  //Other configs
  retries?: number; 
  timeout?: number;
}

interface SpeechEngineConfig {
  provider?: string; // Provider name (e.g., 'default' | 'openai' | 'google' | 'azure' | 'custom',)
  lang?: string;
  apiUrl?: string;  // API endpoint URL 
  apiKey?: string; // API key if required  
  model?: string;  // Model name if applicable
  confidence?: number; // Confidence threshold (0.0-1.0)    
  options?: Record<string, any>; // Any additional options needed
}

export interface RecognitionConfig extends SpeechEngineConfig {
}

export interface TranscriptionConfig extends SpeechEngineConfig {  
}

export interface CoreConfig {
  transcriptionConfig: TranscriptionConfig; 
  recognitionConfig: RecognitionConfig;
  uiConfig: UIConfig
  actuatorConfig: ActuatorConfig
}

export interface UIConfig {
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

export const DEFAULT_UI_CONFIG: UIConfig = {
  containerId: 'speech-container',
  position: 'bottom-right',
  width: '300px',
  height: '400px',
  autoStart: false,
  showProgress: true,
  showTranscription: true
};

export interface ActuatorConfig {
  retries?:number,
  timeout?: number,
}

export enum IntentTypes {
  CLICK_ELEMENT = 'click_element',
  SCROLL_TO_ELEMENT = 'scroll_to_element',
  FILL_INPUT = 'fill_input',
  SPEAK_TEXT = 'speak_text',
  SUBMIT_FORM = 'submit_form',
  UNKNOWN = 'UNKNOWN'
}
// Audio Capturer interface
export interface AudioCapturer {
  startRecording(): void;
  stopRecording(): Promise<Blob>;
}
// Intent recognition result
export interface IntentResult {
  intent: IntentTypes;
  confidence: number;
  entities?: Entities;
}
export type Entities = Record<string, any>;

export interface CommandIntent {
  name: string;
  utterances: string[];
  entities: string[];
}

export interface CommandRegistry {
  intents: CommandIntent[];
}

export interface Actuator {
  performAction(intent: IntentResult): Promise<boolean>;
}

//Actuator
export interface Action {
  execute(entities: Entities): boolean;
}
export interface IActionRegistry {
  registerAction(name: string, action: Action): void;
  mapIntentToAction(intent: string, actionName: string): void;
  getActions(intent: string): Action[];
  getRegisteredActionNames(): string[];
}