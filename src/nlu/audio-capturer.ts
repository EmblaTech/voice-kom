import { Logger } from '../utils/logger';
import { AudioCapturer, VADConfig } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';

export class WebAudioCapturer implements AudioCapturer {
  // --- Properties for the user's trusted recording logic ---
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  // --- VAD Properties ---
  private vadStream: MediaStream | null = null; // A separate stream just for VAD
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  // --- State Management ---
  private isMonitoring = false; // Is the VAD loop active?
  private isRecording = false;  // Is MediaRecorder currently recording a chunk?
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private animationFrameId: number | null = null;

  // --- VAD Configuration ---
  private silenceDelay = 1500;
  private speakingThreshold = 0.02;

  private readonly logger = Logger.getInstance();

  constructor(private readonly eventBus: EventBus) {}

  public async listenForUtterance(config: VADConfig): Promise<void> {
    if (this.isMonitoring) return;
    this.logger.info('Starting VAD monitoring to listen for utterance.');

    this.silenceDelay = config.silenceDelay;
    this.speakingThreshold = config.speakingThreshold;

    try {
      // We get a stream specifically for the VAD analyser.
      this.vadStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaStreamSource(this.vadStream);
      this.source.connect(this.analyser);
      this.isMonitoring = true;
      this.monitor();
    } catch (error) {
      this.logger.error('Error starting VAD:', error);
      this.cleanup();
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
    }
  }

  public stopListening(): void {
    if (!this.isMonitoring) return;
    this.logger.info('Stopping all listening activities.');
    this.isMonitoring = false;
    // If we are in the middle of a recording when stop is called, stop it.
    if (this.isRecording) {
      this.mediaRecorder?.stop(); // This will trigger its own cleanup.
    }
    this.cleanup();
  }

  /**
   * --- TRUSTED RECORDING LOGIC ---
   * This is your previously working `startRecording` method, adapted to be called internally.
   */
  private startSingleRecording(): void {
    if (this.isRecording) {
      this.logger.warn('Recording already in progress.');
      return;
    }
    this.logger.info('Speech detected! Starting audio recording.');
    this.eventBus.emit(SpeechEvents.RECORDING_STARTED);

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.isRecording = true;
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);

        // onDataAvailable: Collects audio chunks
        this.mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        });

        // onStop: Finalizes blob and emits it.
        this.mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.logger.info(`Audio captured, blob size: ${audioBlob.size}`);

          // Emit the event with the captured audio.
          this.eventBus.emit(SpeechEvents.AUDIO_CAPTURED, audioBlob);
          
          // Clean up this specific recording instance.
          stream.getTracks().forEach(track => track.stop());
          this.isRecording = false;
          this.mediaRecorder = null;
        });
        
        this.mediaRecorder.start();
      })
      .catch((error: unknown) => {
        this.logger.error('Error during internal startSingleRecording:', error);
        this.isRecording = false;
        this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
      });
  }

  /**
   * --- TRUSTED STOP LOGIC ---
   * This is a simplified version of your `stopRecording` logic.
   */
  private stopSingleRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.logger.info("Silence detected, stopping recording.");
      this.mediaRecorder.stop();
    }
  }

  private monitor = () => {
    if (!this.isMonitoring) {
      this.cleanup();
      return;
    }

    const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
    this.analyser!.getByteTimeDomainData(dataArray);
    
    let sum = 0;
    for (const amp of dataArray) { sum += Math.pow(amp / 128.0 - 1, 2); }
    const volume = Math.sqrt(sum / dataArray.length);
    const isSpeaking = volume > this.speakingThreshold;

    if (isSpeaking) {
      clearTimeout(this.silenceTimer!);
      this.silenceTimer = null;
      if (!this.isRecording) {
        // VAD has detected speech, so trigger the reliable recording method.
        this.startSingleRecording();
      }
    } else {
      if (this.isRecording && !this.silenceTimer) {
        // VAD has detected silence, so trigger the reliable stop method.
        this.silenceTimer = setTimeout(() => {
          this.stopSingleRecording();
        }, this.silenceDelay);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.monitor);
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Cleans up the VAD-specific resources.
   * The MediaRecorder cleans itself up in its 'stop' event listener.
   */
  private cleanup() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    this.vadStream?.getTracks().forEach(track => track.stop());
    this.source?.disconnect();
    this.audioContext?.close().catch(e => this.logger.warn("AudioContext may already be closed.", e));
    
    this.animationFrameId = null;
    this.silenceTimer = null;
    this.vadStream = null;
    this.audioContext = null;
    this.source = null;
    this.analyser = null;
  }
}