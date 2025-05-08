// enhanced-types.ts
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

// Enhanced Recording status enum with WAITING state
export enum RecordingStatus {
  IDLE = 'idle',
  WAITING = 'waiting', // New state for when we're waiting for speech in listening mode
  RECORDING = 'recording',
  PROCESSING = 'processing',
  EXECUTING = 'executing',
  ERROR = 'error'
}

export enum ErrorType {
  MICROPHONE_ACCESS = 'microphone_access',
  TRANSCRIPTION = 'transcription',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

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
  init(config: { language?: string, apiKey?: string }): void;
  transcribe(audioBlob: Blob): Promise<string>;
  getAvailableLanguages(): string[];
}

// NLP Module interface
export interface INLPModule {
  init(config: { language?: string, apiKey?: string }): Promise<void>;
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
  init(container: HTMLElement): void;
  updateFromState(): void;
  setTranscription(transcription: string): void;
}

// Core Module interface
export interface ICoreModule {
  init(container: HTMLElement, config: { language?: string, apiKey?: string }): Promise<void>;
  startListening(): void;
  stopListening(): void;
}

// Voice Lib interface
export interface IVoiceLib {
  init(config: { 
    container: HTMLElement; 
    language?: string;
    apiKey?: string; 
  }): Promise<void>;
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
  init(config: { language?: string, commandRegistry?: CommandRegistry }): void;
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