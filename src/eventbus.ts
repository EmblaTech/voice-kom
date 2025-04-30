// EventBus.ts
import { injectable } from 'inversify';
import { EventEmitter } from 'events';

export enum VoiceLibEvents {
  RECORD_BUTTON_PRESSED = 'ui:recordButtonPressed',
  STOP_BUTTON_PRESSED = 'ui:stopButtonPressed',
  RECORDING_STARTED = 'audio:recordingStarted',
  RECORDING_STOPPED = 'audio:recordingStopped',
  TRANSCRIPTION_STARTED = 'process:transcriptionStarted',
  TRANSCRIPTION_COMPLETED = 'process:transcriptionCompleted',
  STATE_CHANGED = 'state:changed',
  ERROR_OCCURRED = 'error:occurred'
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
    console.log(eventName)
  }
}