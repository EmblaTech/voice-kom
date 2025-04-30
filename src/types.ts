// types.ts
import { EventEmitter } from 'events';

// Type identifiers for dependency injection
export const TYPES = {
  CoreModule: Symbol.for('CoreModule'),
  NLPModule: Symbol.for('NLPModule'),
  UIComponent: Symbol.for('UIComponent'),
  AudioCapturer: Symbol.for('AudioCapturer'),
  STTDriver: Symbol.for('STTDriver'),
  EventBus: Symbol.for('EventBus'),
  StateStore: Symbol.for('StateStore')
};

// Recording status enum
export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
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
  stopListening(): void;
  getAvailableLanguages(): string[];
}

// Audio Capturer interface
export interface IAudioCapturer {
  startRecording(): void;
  stopRecording(): void;
}

// UI Component interface
export interface IUIComponent {
  init(container: HTMLElement): void;
  updateFromState(): void;
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
  init(config: { language?: string }): void;
  identifyIntent(text: string): IntentResult;
  getAvailableIntents(): string[];
}