// eventbus.ts
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

//TODO: Remove this class and set status from necessary places to avoid complexity
// Define event types
export enum SpeechEvents {
  // UI Events
  RECORD_BUTTON_PRESSED = 'recordButtonPressed',
  STOP_BUTTON_PRESSED = 'stopButtonPressed',
  
  // Recording Events
  RECORDING_STARTED = 'recordingStarted',
  RECORDING_STOPPED = 'recordingStopped',
  AUDIO_CAPTURED = 'audioCaptured',  // New event for when speech is detected and captured

  // Processing Events
  TRANSCRIPTION_STARTED = 'transcriptionStarted',
  TRANSCRIPTION_COMPLETED = 'transcriptionCompleted',
  NLU_COMPLETED ='nluCompleted',

  // Action Events
  ACTION_PERFORMED = 'actionPerformed',
  ACTION_PAUSED = 'actionPaused',
  EXECUTION_COMPLETE = 'execution-complete',
  // Error Events
  ERROR_OCCURRED = 'errorOccurred'
}

export class EventBus {
  private readonly events = new EventEmitter();
  private readonly logger = Logger.getInstance();

  constructor() {
    this.events.setMaxListeners(20);
  }
  
  public on(eventName: SpeechEvents, callback: (...args: any[]) => void): void {
    this.events.on(eventName, callback);
  }
  
  public emit(eventName: SpeechEvents, ...args: any[]): void {
    this.events.emit(eventName, ...args);
    this.logger.debug(`[SpeechEventBus] Event emitted: ${eventName}`, ...args);;
  }
}