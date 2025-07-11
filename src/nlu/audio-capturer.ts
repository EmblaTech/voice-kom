import { Logger } from '../utils/logger';
import { AudioCapturer } from '../types';

export class WebAudioCapturer implements AudioCapturer {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private resolveAudioPromise: ((value: Blob) => void) | null = null;
  private rejectAudioPromise: ((reason?: any) => void) | null = null;
  private readonly logger = Logger.getInstance();
  public startRecording(): void {
    this.logger.info("Starting audio recording");
    
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
        this.logger.error('Error accessing microphone:', error);
        if (this.rejectAudioPromise) {
          this.rejectAudioPromise(error);
        }
      });
  }
  
  public stopRecording(): Promise<Blob> {
    this.logger.info("Stopping audio recording");
    
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