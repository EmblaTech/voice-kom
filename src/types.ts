// enhanced-types.ts
import {NLPConfig,NLUEngineConfig,STTConfig} from "../src/nlp/model/nlpConfig";
import {CoreConfig} from "./core/model/coreConfig";
import {UIConfig} from "./ui/model/uiConfig";

export interface SpeechPlugConfig {
  //Key configs
  containerId? :string;
  lang?: string;   

  //Speech engine configs
  transcriptionProvider?: TranscriptionProviderConfig;  //Transcription options
  recognitionProvider?: RecognitionProviderConfig; // NLU options    

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

interface ProviderConfig {
  name?: string; // Provider name (e.g., 'default' | 'openai' | 'google' | 'azure' | 'custom',)
  apiUrl?: string;  // API endpoint URL 
  apiKey?: string; // API key if required  
  model?: string;  // Model name if applicable
  confidence?: number; // Confidence threshold (0.0-1.0)    
  options?: Record<string, any>; // Any additional options needed
}

export interface RecognitionProviderConfig extends ProviderConfig {
}

export interface TranscriptionProviderConfig extends ProviderConfig {
  lang?: string;
}

export const TYPES = {
  CoreModule: Symbol.for('CoreModule'),
  NLPModule: Symbol.for('NLPModule'),
  UIComponent: Symbol.for('UIComponent'),
  AudioCapturer: Symbol.for('AudioCapturer'),
  STTDriver: Symbol.for('STTDriver'),
  EventBus: Symbol.for('EventBus'),
  StateStore: Symbol.for('StateStore'),
  NLUDriver: Symbol.for('NLUDriver'),
  CommandRegistry: Symbol.for('CommandRegistry'),
  VoiceActuator: Symbol.for('VoiceActuator'),
};

export enum IntentTypes {
  CLICK_ELEMENT = 'click_element',
  SCROLL_TO_ELEMENT = 'scroll_to_element',
  FILL_INPUT = 'fill_input',
  SPEAK_TEXT = 'speak_text',
  SUBMIT_FORM = 'submit_form',
  UNKNOWN = 'UNKNOWN'
}

// STT Driver interface
export interface ISTTDriver {
  init( lang:string ,config: STTConfig): void;
  transcribe(audioBlob: Blob): Promise<string>;
  getAvailableLanguages(): string[];
}

// NLP Module interface
export interface INLPModule {
  init( config: NLPConfig): Promise<void>;
  startListening(): void;
  stopListening(): Promise<void>;
  getAvailableLanguages(): string[];
}

// Audio Capturer interface
export interface IAudioCapturer {
  startRecording(): void;
  stopRecording(): Promise<Blob>;
}

// UIcomponent Interface
export interface IUIComponent {
  init(config:UIConfig): void;
  updateFromState(): void;
  setTranscription(transcription: string): void;
}

// Core Module interface
export interface ICoreModule {
  init(config: CoreConfig): Promise<void>;
  startListening(): void;
  stopListening(): void;
}

// Voice Lib interface
export interface IVoiceLib {
  init(config: SpeechPlugConfig): Promise<void>;
}

// Intent recognition result
export interface IntentResult {
  intent: IntentTypes;
  confidence: number;
  entities?: Entities;
}
export type Entities = Record<string, any>;

// NLU Driver interface
export interface INLUDriver {
  init( lang:string , config: NLUEngineConfig): void;
  identifyIntent(text: string): IntentResult;
  getAvailableIntents(): string[];
}

export interface CommandIntent {
  name: string;
  utterances: string[];
  entities: string[];
}

export interface CommandRegistry {
  intents: CommandIntent[];
}

export interface IVoiceActuator {
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