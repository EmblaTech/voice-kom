// eventbus.ts
import { EventEmitter } from 'events';
import { injectable } from 'inversify';

// Define event types
export enum VoiceLibEvents {
  // UI Events
  RECORD_BUTTON_PRESSED = 'recordButtonPressed',
  STOP_BUTTON_PRESSED = 'stopButtonPressed',
  
  // Recording Events
  RECORDING_STARTED = 'recordingStarted',
  RECORDING_STOPPED = 'recordingStopped',
  
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

@injectable()
export class EventBus {
  private events = new EventEmitter();
  
  constructor() {
    this.events.setMaxListeners(20);
  }
  
  public on(eventName: VoiceLibEvents, callback: (...args: any[]) => void): void {
    this.events.on(eventName, callback);
  }
  
  public emit(eventName: VoiceLibEvents, ...args: any[]): void {
    this.events.emit(eventName, ...args);
    console.log(eventName);
  }
}