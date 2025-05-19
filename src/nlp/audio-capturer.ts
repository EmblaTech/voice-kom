// audio-capturer.ts
import { injectable, inject } from 'inversify';
import { IAudioCapturer, TYPES } from '../types';
import { EventBus } from '../utils/eventbus';

@injectable()
export class WebAudioCapturer implements IAudioCapturer {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private resolveAudioPromise: ((value: Blob) => void) | null = null;
  private rejectAudioPromise: ((reason?: any) => void) | null = null;
  
  constructor(
    @inject(TYPES.EventBus) private eventBus: EventBus,
  ) {}
  
  public startRecording(): void {
    console.log("Starting audio recording");
    
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
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Resolve the promise with the recorded audio blob
          if (this.resolveAudioPromise) {
            this.resolveAudioPromise(audioBlob);
          }
          
          // Stop all tracks in the stream to release the microphone
          stream.getTracks().forEach(track => track.stop());
        });
        
        this.mediaRecorder.start();
      })
      .catch((error: unknown) => {
        console.error('Error accessing microphone:', error);
        if (this.rejectAudioPromise) {
          this.rejectAudioPromise(error);
        }
      });
  }
  
  public stopRecording(): Promise<Blob> {
    console.log("Stopping audio recording");
    
    return new Promise<Blob>((resolve, reject) => {
      this.resolveAudioPromise = resolve;
      this.rejectAudioPromise = reject;
      
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        reject(new Error("MediaRecorder not available or already stopped"));
      }
    });
  }
}