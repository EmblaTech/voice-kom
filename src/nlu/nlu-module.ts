import { AudioCapturer, CommandRegistry, TranscriptionConfig, RecognitionConfig } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { TranscriptionDriver } from './transcription/driver';
import { RecognitionDriver } from './recognition/driver';
import { DriverFactory } from './driver-factory';

export class NLUModule  {
  private commandRegistry: CommandRegistry | null = null;
  private readonly language: string = 'en';  
  private transcriptionDriver!: TranscriptionDriver
  private recognitionDriver!: RecognitionDriver
  constructor(
    private readonly audioCapturer: AudioCapturer,    
    private readonly eventBus: EventBus,
    private readonly status: Status
  ) {}
  
  public async init(transConfig: TranscriptionConfig, recogConfig: RecognitionConfig): Promise<void> {    
    this.transcriptionDriver = DriverFactory.getTranscriptionDriver(transConfig);
    this.recognitionDriver = DriverFactory.getReconitionDriver(recogConfig);
  }

  
  public startListening(): void {
    // Start audio capture
    this.audioCapturer.startRecording();
    this.eventBus.emit(SpeechEvents.RECORDING_STARTED);
  }
  
  public async stopListening(): Promise<void> {
    try {
      // Stop audio capture and get audio blob directly
      const audioBlob = await this.audioCapturer.stopRecording();
      this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);
            
      try {
        // Transcribe the audio using the STT driver
        const transcription = await this.transcriptionDriver.transcribe(audioBlob);
        this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcription);

        // Identify intent using the NLU driver
        const intentResult = this.recognitionDriver.detectIntent(transcription);
        this.eventBus.emit(SpeechEvents.NLU_COMPLETED, intentResult);

      } catch (error: any) {
        console.error('Error:', error);
        this.status.set(StatusType.ERROR, error.message);
        this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
      }
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      this.status.set(StatusType.ERROR, error.message);
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
    }
  }

  private getCommands(): CommandRegistry {
    const commandRegistry = {
      intents: [
        {
          name: "click_element",
          utterances: ["click (target)", "press (target)", "tap (target)"],
          entities: ["target"]
        }
      ]
    };
    return commandRegistry;
  }
  }