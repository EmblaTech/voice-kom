// StateStore.ts
import { injectable, inject } from 'inversify';
import { EventBus, VoiceLibEvents } from './eventbus';
import { RecordingStatus, TYPES } from './types';

export interface VoiceLibState {
  recordingStatus: RecordingStatus;
  transcription: string;
  error: Error | null;
  isProcessing: boolean;
}

@injectable()
export class StateStore {
  private state: VoiceLibState = {
    recordingStatus: RecordingStatus.IDLE,
    transcription: '',
    error: null,
    isProcessing: false
  };

  constructor(@inject(TYPES.EventBus) private eventBus: EventBus) {}

  public getState(): VoiceLibState {
    return { ...this.state };
  }

  public setRecordingStatus(status: RecordingStatus): void {
    this.state.recordingStatus = status;
    this.notifyChange();
  }

  public setTranscription(text: string): void {
    this.state.transcription = text;
    this.notifyChange();
  }

  public setError(error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.state.error = errorObj;
    this.state.recordingStatus = RecordingStatus.ERROR;
    this.eventBus.emit(VoiceLibEvents.ERROR_OCCURRED, errorObj);
    this.notifyChange();
  }

  public clearError(): void {
    this.state.error = null;
    this.notifyChange();
  }

  public setProcessing(isProcessing: boolean): void {
    this.state.isProcessing = isProcessing;
    this.notifyChange();
  }

  public reset(): void {
    this.state = {
      recordingStatus: RecordingStatus.IDLE,
      transcription: '',
      error: null,
      isProcessing: false
    };
    this.notifyChange();
  }

  private notifyChange(): void {
    this.eventBus.emit(VoiceLibEvents.STATE_CHANGED, this.getState());
  }
}