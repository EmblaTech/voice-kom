import { Logger } from '../utils/logger';
import { AudioCapturer } from '../types';

export class WebAudioCapturer implements AudioCapturer {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private resolveAudioPromise: ((value: Blob) => void) | null = null;
  private rejectAudioPromise: ((reason?: any) => void) | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private readonly logger = Logger.getInstance();

  public startRecording(): void {
    if (this.isRecording) {
      this.logger.warn('Recording already in progress.');
      return;
    }
    this.logger.info('Starting audio recording');

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.audioChunks = [];
        this.stream = stream;
        this.mediaRecorder = new MediaRecorder(stream);

        const onDataAvailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        const onStop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          // Resolve the promise with the recorded audio blob
          if (this.resolveAudioPromise) {
            this.resolveAudioPromise(audioBlob);
          }
          this.cleanup();
        };

        const onError = (event: Event) => {
          this.logger.error('MediaRecorder error:', this.mediaRecorder?.onerror);  //   this.logger.error('MediaRecorder error occurred');
          if (this.rejectAudioPromise) {
            this.rejectAudioPromise(new Error('MediaRecorder error occurred'));
          }
          this.cleanup();
        };

        this.mediaRecorder.addEventListener('dataavailable', onDataAvailable);
        this.mediaRecorder.addEventListener('stop', onStop);
        this.mediaRecorder.addEventListener('error', onError);

        // Store listeners for removal
        (this.mediaRecorder as any)._listeners = { onDataAvailable, onStop, onError };

        this.mediaRecorder.start();
        this.isRecording = true;
      })
      .catch((error: unknown) => {
        this.logger.error('Error accessing microphone:', error);
        if (this.rejectAudioPromise) {
          this.rejectAudioPromise(error);
        }
        this.cleanup();
      });
  }

  public stopRecording(): Promise<Blob> {
    this.logger.info('Stopping audio recording');

    return new Promise<Blob>((resolve, reject) => {
      this.resolveAudioPromise = resolve;
      this.rejectAudioPromise = reject;

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        this.logger.error('MediaRecorder not available or already stopped');
        this.cleanup();
        reject(new Error('MediaRecorder not available or already stopped'));
      }
    });
  }

  private cleanup() {
    if (this.mediaRecorder && (this.mediaRecorder as any)._listeners) {
      const { onDataAvailable, onStop, onError } = (this.mediaRecorder as any)._listeners;
      this.mediaRecorder.removeEventListener('dataavailable', onDataAvailable);
      this.mediaRecorder.removeEventListener('stop', onStop);
      this.mediaRecorder.removeEventListener('error', onError);
      delete (this.mediaRecorder as any)._listeners;
    }
    
    if (this.stream) {
      // Stop all tracks in the stream to release the microphone
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.isRecording = false;
    this.resolveAudioPromise = null;
    this.rejectAudioPromise = null;
    this.audioChunks = [];
  }
}