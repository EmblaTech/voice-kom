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
  private audioCapturer!: AudioCapturer;
  private transcriptionDriver: TranscriptionDriver | null = null;
  private recognitionDriver: RecognitionDriver | null = null;
  private readonly logger = Logger.getInstance();

  // VAD Configuration with defaults
  private silenceTimeout = 1500;
  private speakingThreshold = 0.05;
  
  // Internal state to manage the session loop
  private isSessionActive = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly status: Status
  ) {

    this.eventBus.on(SpeechEvents.AUDIO_CAPTURED, (blob: Blob) => {
      this.processAudioChunk(blob);
    });

    this.eventBus.on(SpeechEvents.ACTUATOR_COMPLETED, () => {
      if (this.isSessionActive) {
        this.startSingleListeningCycle();
      }
    });

  }

  public async init(transConfig: TranscriptionConfig, recogConfig: RecognitionConfig): Promise<void> {
    try {
      this.language = transConfig.lang || 'en';
      

      this.transcriptionDriver = DriverFactory.getTranscriptionDriver(transConfig);
      this.recognitionDriver = DriverFactory.getRecognitionDriver(recogConfig);
      this.audioCapturer = DriverFactory.getAudioCapturer(transConfig, this.eventBus);
      
      this.commandRegistry = await fetchContent('../../src/nlu/command-registry.json');
    } catch (error) {
      this.logger.error('Error in NLUModule init: ', error);
      this.commandRegistry ??= this.getCommands();
    }
  }

  /**
   * Starts the entire listening session. Called once by CoreModule.
   */
  public startListeningSession(): void {
    if (this.isSessionActive) {
        this.logger.warn("Listening session is already active.");
        return;
    }
    this.isSessionActive = true;
    // Kick off the very first listening cycle.
    this.startSingleListeningCycle();
  }

  /**
   * Forcibly stops the entire listening session and cleans up resources. Called once by CoreModule.
   */
  public forceStopSession(): void {
    if (!this.isSessionActive) return;
    this.isSessionActive = false;
    this.audioCapturer.stopListening(); // Tells AudioCapturer to stop VAD and release the mic.
    this.eventBus.emit(SpeechEvents.LISTENING_STOPPED);
    this.logger.info("Listening session forced to stop by user.");
  }
  
  /**
   * Internal method to start a single listening cycle.
   * This is called at the beginning of a session and after each command is processed.
   */
  private startSingleListeningCycle(): void {
    // Guard against starting if the session was just stopped.
    if (!this.isSessionActive) return;

    this.logger.info("Starting a single listening cycle.");
    // Tell the AudioCapturer to listen for ONE utterance with the configured sensitivity.
    this.audioCapturer.listenForUtterance({
        silenceDelay: this.silenceTimeout,
        speakingThreshold: this.speakingThreshold
    });
    // Let the rest of the system know we are now in a listening state.
    this.eventBus.emit(SpeechEvents.LISTEN_STARTED);
  }

  /**
   * Processes a single audio chunk after it has been captured by the AudioCapturer.
   */
  private async processAudioChunk(audioBlob: Blob): Promise<void> {
    if (!this.transcriptionDriver || !this.recognitionDriver) {
      this.logger.error('Transcription or Recognition Driver not initialized');
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED); // Ensure loop can continue
      return; 
    }
    
    // Let the system know processing has begun.
    this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);
    
    if (!this.isSessionActive) {
      this.logger.info("Ignoring audio chunk because session is inactive.");
      return;
    }
    
    try {
      const transcription = await this.transcriptionDriver.transcribe(audioBlob);
      this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcription);

      const intentResult = await this.recognitionDriver.detectIntent(transcription);
      this.eventBus.emit(SpeechEvents.NLU_COMPLETED, intentResult);

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Error during audio chunk processing: ', errMsg);
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