// stateStore.ts
import { injectable } from 'inversify';
import { RecordingStatus } from './types';

// Interface for state structure
interface VoiceLibState {
  recordingStatus: RecordingStatus;
  error: Error | unknown | null;
}

@injectable()
export class StateStore {
  private state: VoiceLibState = {
    recordingStatus: RecordingStatus.IDLE,
    error: null
  };
  
  // Get current state (immutable)
  public getState(): Readonly<VoiceLibState> {
    return { ...this.state };
  }
  
  // Set recording status
  public setRecordingStatus(status: RecordingStatus): void {
    this.state.recordingStatus = status;
  }
  
  // Set error
  public setError(error: Error | unknown): void {
    this.state.error = error;
    this.state.recordingStatus = RecordingStatus.ERROR;
  }
  
  // Reset state
  public resetState(): void {
    this.state = {
      recordingStatus: RecordingStatus.IDLE,
      error: null
    };
  }
}