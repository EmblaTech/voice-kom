// audio-capturer.ts
import { injectable, inject } from 'inversify';
import { IAudioCapturer, RecordingStatus, TYPES } from '../types';
import { EventStore, VoiceLibEvents } from '../eventstore';

@injectable()
export class WebAudioCapturer implements IAudioCapturer {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  constructor(
    @inject(TYPES.EventStore) private eventStore: EventStore
  ) {}
  
  public startRecording(): void {
    const state = this.eventStore.getState();
    if (state.recordingStatus === RecordingStatus.RECORDING) return;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        });
        
        this.mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          
          // Emit event with the recorded audio blob through the EventStore
          this.eventStore.emit(VoiceLibEvents.RECORDING_STOPPED, audioBlob);
          
          // Stop all tracks in the stream to release the microphone
          stream.getTracks().forEach(track => track.stop());
        });
        
        this.mediaRecorder.start();
        
        // Emit recording started event
        this.eventStore.emit(VoiceLibEvents.RECORDING_STARTED);
      })
      .catch((error: unknown) => {
        console.error('Error accessing microphone:', error);
        this.eventStore.setError(error);
      });
  }
  
  public stopRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }
}