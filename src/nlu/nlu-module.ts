import { AudioCapturer, CommandRegistry, TranscriptionConfig, RecognitionConfig } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { TranscriptionDriver } from './transcription/driver';
import { RecognitionDriver } from './recognition/driver';
import { DriverFactory } from './driver-factory';
import { Logger } from '../utils/logger';
import { fetchContent } from '../utils/resource-fetcher';

export class NLUModule {
  private commandRegistry: CommandRegistry | null = null;
  private language: string = 'en';
  private transcriptionDriver: TranscriptionDriver | null = null;
  private recognitionDriver: RecognitionDriver | null = null;
  private readonly logger = Logger.getInstance();

  constructor(
    private readonly audioCapturer: AudioCapturer,
    private readonly eventBus: EventBus,
    private readonly status: Status
  ) { }

  public async init(transConfig: TranscriptionConfig, recogConfig: RecognitionConfig): Promise<void> {
    try {
      // Set language from config if provided
      if (transConfig.lang) {
        this.language = transConfig.lang;
      }

      // Initialize transcription & recognition driver
      this.transcriptionDriver = DriverFactory.getTranscriptionDriver(transConfig);
      this.recognitionDriver = DriverFactory.getRecognitionDriver(recogConfig);
      // Get commands
      //this.commandRegistry = await fetchContent('command-registry.json');
      this.commandRegistry = await fetchContent('../../src/nlu/command-registry.json');
    } catch (error) {
      this.logger.error('Error injectStyles(): ', error);
      this.commandRegistry ??= this.getCommands();
    }
  }

  public startListening(): void {
    // Start audio capture
    this.audioCapturer.startRecording();
    this.eventBus.emit(SpeechEvents.RECORDING_STARTED);
  }

  public async stopListening(): Promise<void> {
    if (!this.transcriptionDriver || !this.recognitionDriver) {
      this.logger.error('Transcription or Recognition Driver not initialized');
      throw new Error('Transcription or Recognition Driver not initialized');  // *********************
    }

    try {
      // Stop audio capture and get audio blob directly
      const audioBlob = await this.audioCapturer.stopRecording();
      this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);

      // Transcribe the audio using the STT driver
      const transcription = await this.transcriptionDriver.transcribe(audioBlob);     
      this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcription);

      if (transcription) {
        // Identify intent using the NLU driver
        const intentResult = await this.recognitionDriver.detectIntent(transcription);
        this.eventBus.emit(SpeechEvents.NLU_COMPLETED, intentResult);
      } else {
        this.eventBus.emit(SpeechEvents.NLU_COMPLETED);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Error: ', errMsg);
      this.status.set(StatusType.ERROR, errMsg);
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
    }
  }

  public getAvailableLanguages(): string[] {
    if (!this.transcriptionDriver) return [];
    return this.transcriptionDriver.getAvailableLanguages();
  }

  private getCommands(): CommandRegistry {
    return {
      intents: [
        {
          name: "click_element",
          utterances: ["click (target)", "press (target)", "tap (target)"],
          entities: ["target"]
        }
      ]
    };
  }
}