// EventStore.ts
import { injectable } from 'inversify';
import { EventEmitter } from 'events';
import { RecordingStatus } from './types';

/**
 * Event names used throughout the application
 */
export enum VoiceLibEvents {
  // UI Events
  RECORD_BUTTON_PRESSED = 'ui:recordButtonPressed',
  STOP_BUTTON_PRESSED = 'ui:stopButtonPressed',
  
  // Audio Events
  RECORDING_STARTED = 'audio:recordingStarted',
  RECORDING_STOPPED = 'audio:recordingStopped',
  
  // Processing Events
  TRANSCRIPTION_STARTED = 'process:transcriptionStarted',
  TRANSCRIPTION_COMPLETED = 'process:transcriptionCompleted',
  
  // State Events
  STATE_CHANGED = 'state:changed',
  
  // Error Events
  ERROR_OCCURRED = 'error:occurred'
}

/**
 * Application state interface
 */
export interface VoiceLibState {
  recordingStatus: RecordingStatus;
  transcription: string;
  error: Error | null;
  isProcessing: boolean;
  errorMessage?: string;
}

/**
 * Centralized event and state management for VoiceLib
 */
@injectable()
export class EventStore {
  private events: EventEmitter = new EventEmitter();
  
  // Application state
  private state: VoiceLibState = {
    recordingStatus: RecordingStatus.IDLE,
    transcription: '',
    error: null,
    isProcessing: false
  };

  constructor() {
    // Increase max listeners to prevent memory leak warnings
    this.events.setMaxListeners(20);
  }
  
  /**
   * Subscribe to an event
   * @param eventName The event to subscribe to
   * @param callback The callback function
   */
  public on(eventName: VoiceLibEvents, callback: (...args: any[]) => void): void {
    this.events.on(eventName, callback);
  }
  
  /**
   * Emit an event
   * @param eventName The event to emit
   * @param args Arguments to pass to handlers
   */
  public emit(eventName: VoiceLibEvents, ...args: any[]): void {
    this.events.emit(eventName, ...args);
  }
  
  /**
   * Get current application state
   */
  public getState(): VoiceLibState {
    return { ...this.state };
  }
  
  /**
   * Update recording status
   * @param status New recording status
   */
  public setRecordingStatus(status: RecordingStatus): void {
    this.state.recordingStatus = status;
    this.events.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
  
  /**
   * Update transcription text
   * @param text New transcription text
   */
  public setTranscription(text: string): void {
    this.state.transcription = text;
    this.events.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
  
  /**
   * Set error state
   * @param error Error object or error message
   */
  public setError(error: unknown): void {
    // Convert the unknown error to an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.state.error = errorObj;
    this.state.recordingStatus = RecordingStatus.ERROR;
    this.events.emit(VoiceLibEvents.ERROR_OCCURRED, errorObj);
    this.events.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
  
  /**
   * Clear error state
   */
  public clearError(): void {
    this.state.error = null;
    this.events.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
  
  /**
   * Set processing state
   * @param isProcessing Whether audio is being processed
   */
  public setProcessing(isProcessing: boolean): void {
    this.state.isProcessing = isProcessing;
    this.events.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
  
  /**
   * Reset state to initial values
   */
  public resetState(): void {
    this.state = {
      recordingStatus: RecordingStatus.IDLE,
      transcription: '',
      error: null,
      isProcessing: false
    };
    this.events.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
}