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
      this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);
      this.processAudioChunk(blob);
    });

     this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
      this.processTranscription(transcription);
    });

    this.eventBus.on(SpeechEvents.ACTUATOR_COMPLETED, () => {
      if (this.isSessionActive) {
        this.startSingleListeningCycle();
      }
    });

  }

 // in NLUModule.ts
public async init(transConfig: TranscriptionConfig, recogConfig: RecognitionConfig): Promise<void> {
    this.logger.info("NLUModule.init() starting...");
    try {
      this.language = transConfig.lang || 'en';
      
      this.logger.info("Getting transcription driver...");
      this.transcriptionDriver = DriverFactory.getTranscriptionDriver(transConfig);

      this.logger.info("Getting recognition driver...");
      this.recognitionDriver = DriverFactory.getRecognitionDriver(recogConfig);
      
      this.logger.info("Getting audio capturer...");
      this.audioCapturer = DriverFactory.getAudioCapturer(transConfig, this.eventBus);
      this.logger.info("Audio capturer has been assigned.", this.audioCapturer); // Check if this logs an object
      
      this.commandRegistry = await fetchContent('../../src/nlu/command-registry.json');
      this.logger.info("NLUModule.init() completed successfully.");
    } catch (error) {
      this.logger.error('CRITICAL ERROR in NLUModule init: ', error);
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

    this.audioCapturer.startListening({
        silenceDelay: this.silenceTimeout,
        speakingThreshold: this.speakingThreshold
    });
    // Let the rest of the system know we are now in a listening state.
    this.eventBus.emit(SpeechEvents.LISTEN_STARTED);
  }

  
  private async processAudioChunk(audioBlob: Blob): Promise<void> {

    if (!this.transcriptionDriver) { 
      this.logger.error('Transcription or Recognition Driver not initialized');
      return; 
    }
  // if (!this.isSessionActive) {
  //     this.logger.info("Ignoring audio chunk because session is inactive.");
  //     return;
  //   }
    try {
      const transcription = await this.transcriptionDriver.transcribe(audioBlob);
      this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcription);
    } catch (error) {
      this.logger.error('Error during transcription: ', error);
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED);
    }
  }

  private async processTranscription(transcription: string): Promise<void> {
    if (!this.recognitionDriver) { 
      this.logger.error('Recognition Driver not initialized');
      return; 
    }

    // Handle empty transcriptions
    if (!transcription || transcription.trim() === '') {
        this.logger.warn("Empty transcription received. Skipping intent detection.");
        return;
    }

    try {
      const intentResult = await this.recognitionDriver.detectIntent(transcription);
      this.eventBus.emit(SpeechEvents.NLU_COMPLETED, intentResult);
    } catch (error) {
      this.logger.error('Error during intent recognition: ', error);
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