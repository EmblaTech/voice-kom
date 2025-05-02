// Type identifiers for dependency injection
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

// Recording status enum
export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  EXECUTING = 'executing',
  ERROR = 'error'
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
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

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
  performAction(intent: IntentResult): boolean;
}