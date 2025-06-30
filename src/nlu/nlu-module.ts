import { AudioCapturer, CommandRegistry, TranscriptionConfig, RecognitionConfig } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { TranscriptionDriver } from './transcription/driver';
import { RecognitionDriver } from './recognition/driver';
import { DriverFactory } from './driver-factory';

export class NLUModule {
  private commandRegistry: CommandRegistry | null = null;
  private language: string = 'en';
  private transcriptionDriver!: TranscriptionDriver;
  private recognitionDriver!: RecognitionDriver;
  
  constructor(
    private readonly audioCapturer: AudioCapturer,
    private readonly eventBus: EventBus,
    private readonly status: Status
  ) {console.log("nlu-module.ts constructor()..");}
  
  public async init(transConfig: TranscriptionConfig, recogConfig: RecognitionConfig): Promise<void> {
    console.log("nlu-module.ts init()..");
    // Set language from config if provided
    if (transConfig.lang) {
      this.language = transConfig.lang;
    }
    
    // Initialize transcription driver
    this.transcriptionDriver = DriverFactory.getTranscriptionDriver(transConfig);
    
    // Initialize recognition driver
    this.recognitionDriver = DriverFactory.getRecognitionDriver(recogConfig);
    
    // Get commands
    this.commandRegistry = this.getCommands();
  }

  public startListening(): void {
    // Start audio capture
    this.audioCapturer.startRecording();
    this.eventBus.emit(SpeechEvents.RECORDING_STARTED);
  }
  
  public async stopListening(): Promise<void> {
    if (!this.recognitionDriver) {
      throw new Error('Recognition Driver not initialized');
    }
    
    try {
      // Stop audio capture and get audio blob directly
      const audioBlob = await this.audioCapturer.stopRecording();
      this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);
            
      try {
        // Transcribe the audio using the STT driver
        const transcription = await this.transcriptionDriver.transcribe(audioBlob);
        //const transcription = "fill input full name suppa";
        this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcription);

        // Identify intent using the NLU driver
        const intentResult = await this.recognitionDriver.detectIntent(transcription);
        console.log('nlu-module intentResult:', intentResult);
        this.eventBus.emit(SpeechEvents.NLU_COMPLETED, intentResult);

      } catch (error: unknown) {
        console.error('Error:', error);
        this.status.set(StatusType.ERROR, error instanceof Error ? error.message : String(error));
        this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
      }
    } catch (error: unknown) {
      console.error('Error stopping recording:', error);
      this.status.set(StatusType.ERROR, error instanceof Error ? error.message : String(error));
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
    }
  }
  
  public getAvailableLanguages(): string[] {
    return this.transcriptionDriver.getAvailableLanguages();  //getAvailableLanguages?()
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