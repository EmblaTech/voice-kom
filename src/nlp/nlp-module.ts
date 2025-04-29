// nlp-module.ts
import { injectable, inject } from 'inversify';
import { INLPModule, IAudioCapturer, ISTTDriver, RecordingStatus, TYPES } from '../types';
import { EventStore, VoiceLibEvents } from '../eventstore';

@injectable()
export class NLPModule implements INLPModule {
  private language: string = 'en';
  
  constructor(
    @inject(TYPES.AudioCapturer) private audioCapturer: IAudioCapturer,
    @inject(TYPES.STTDriver) private sttDriver: ISTTDriver,
    @inject(TYPES.EventStore) private eventStore: EventStore
  ) {}
  
  public async init(config: { language?: string, apiKey?: string }): Promise<void> {
    // Initialize the STT driver with language and optional API key
    this.sttDriver.init({
      language: config.language,
      apiKey: config.apiKey
    });
    
    if (config.language) {
      this.language = config.language;
    }
    
    // Set up event listeners through EventStore
    this.eventStore.on(VoiceLibEvents.RECORDING_STOPPED, async (audioBlob: Blob) => {
      try {
        // Update state to processing
        this.eventStore.setRecordingStatus(RecordingStatus.PROCESSING);
        
        // Emit transcription started event
        this.eventStore.emit(VoiceLibEvents.TRANSCRIPTION_STARTED);
        
        // Process the audio
        const transcription = await this.sttDriver.transcribe(audioBlob);
        
        // Update state with transcription results
        this.eventStore.setTranscription(transcription);
        this.eventStore.setRecordingStatus(RecordingStatus.IDLE);
        
        // Emit transcription completed event
        this.eventStore.emit(VoiceLibEvents.TRANSCRIPTION_COMPLETED, transcription);
      } catch (error: unknown) {
        console.error('Transcription error:', error);
        this.eventStore.setError(error);
      }
    });
  }
  
  public startListening(): void {
    const state = this.eventStore.getState();
    if (state.recordingStatus === RecordingStatus.IDLE) {
      this.eventStore.setRecordingStatus(RecordingStatus.RECORDING);
      this.audioCapturer.startRecording();
    }
  }
  
  public stopListening(): void {
    const state = this.eventStore.getState();
    if (state.recordingStatus === RecordingStatus.RECORDING) {
      this.audioCapturer.stopRecording();
    }
  }
  
  public getAvailableLanguages(): string[] {
    return this.sttDriver.getAvailableLanguages();
  }
}