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
  
  //Other configs
  retries?: number; 
  timeout?: number;
  loglevel?: string; //TODO: Implement display log above configured log level
  ui?: Record<string, any>;
}

interface SpeechEngineConfig {
  provider: string; // Provider name (e.g., 'default' | 'openai' | 'google' | 'azure' | 'custom',)
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
  styleUrl?: string;
}

export interface ActuatorConfig {
  retries?:number,
  timeout?: number,
}

export enum IntentTypes {
  CLICK_ELEMENT = 'click_element',
  SCROLL= 'scroll',
  SCROLL_TO_ELEMENT = 'scroll_to_element',
  FILL_INPUT = 'fill_input',
  SPEAK_TEXT = 'speak_text',
  SUBMIT_FORM = 'submit_form',
  UNKNOWN = 'UNKNOWN',
  CHECK_CHECKBOX = 'check_checkbox',
  UNCHECK_CHECKBOX ='uncheck_checkbox',
  CHECK_ALL = 'check_all',
  UNCHECK_ALL = 'uncheck_all',
  SELECT_RADIO_OR_DROPDOWN = 'select_radio_or_dropdown',
  OPEN_DROPDOWN = 'open_dropdown',
  GO_BACK = 'go_back',
  FILL_FORM = 'fill_form'
}

// Audio Capturer interface
export interface AudioCapturer {
  listenForUtterance(config: VADConfig): Promise<void>;
  stopListening(): void;
}

export interface VADConfig {
  silenceDelay: number;
  speakingThreshold: number;
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

export enum TranscriptionProviders {
  DEFAULT = 'default',
  GOOGLE = 'google',
  AZURE = 'azure'
}

export enum ReconitionProvider {
  DEFAULT = 'default',
  OPENAI = 'openai',
  LLM = 'llm',
  GPT = 'gpt',
  COMPROMISE = 'compromise'
}

// STT Driver interface
export interface ISTTDriver {
  //init( lang:string ,config: STTConfig): void;
  transcribe(audioBlob: Blob): Promise<string>;
  getAvailableLanguages(): string[];
}

// NLP Module interface
export interface INLPModule {
  //init( config: NLPConfig): Promise<void>;
  startListening(): void;
  stopListening(): Promise<void>;
  getAvailableLanguages(): string[];
}

// Audio Capturer interface
export interface IAudioCapturer {
  startRecording(): void;
  stopRecording(): Promise<Blob>;
}

// Core Module interface
export interface ICoreModule {
  init(config: CoreConfig): Promise<void>;
  startListening(): void;
  stopListening(): void;
}

// Voice Lib interface
export interface IVoiceLib {
  //init(config: AdapterConfig): Promise<void>;
}

export interface INLUDriver {
  init(lang: string, config: any): void;
  identifyIntent(text: string): Promise<IntentResult[]> | IntentResult[];
  getAvailableIntents(): IntentTypes[];
}

export interface IVoiceActuator {
  performAction(intent: IntentResult[]): Promise<boolean>;
}
