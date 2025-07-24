import { UIHandler } from '../ui/ui-handler';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { CoreConfig, IntentResult } from '../types';
import { VoiceActuator } from '../actuator/voice-actuator';
import { NLUModule } from '../nlu/nlu-module';
import {WebspeechWakewordDetector} from '../wakeword/WebspeechAPICapturer';

export class CoreModule {
  private isListeningModeActive = false;
  private isRecordingModeActive = false;
  constructor(
    private readonly nluModule: NLUModule,
    private readonly uiHandler: UIHandler,
    private readonly voiceActuator: VoiceActuator,
    private readonly eventBus: EventBus,
    private readonly status: Status,
    private readonly wakeWordDetector: WebspeechWakewordDetector

  ) {}

  public async init(config: CoreConfig): Promise<void> {
    await this.uiHandler.init(config.uiConfig);
    await this.nluModule.init(config.transcriptionConfig, config.recognitionConfig);
    this.bindEvents();

    this.status.set(StatusType.IDLE);
    this.uiHandler.updateUIStatus();
    console.log('CoreModule initialized with config:', config);
    // --- INITIALIZE AND START THE WAKE WORD DETECTOR ---
    if (config.wakeWords) {
      console.log(`Initializing wake word detector with: ${config.wakeWords.join(', ')}`);
      console.log(`Sleep words are: ${config.sleepWords ? config.sleepWords.join(', ') : 'none'}`);
      this.wakeWordDetector.init(config.wakeWords, config.sleepWords);
      this.wakeWordDetector.start();
    }
  }

  private bindEvents(): void {
    // --- Session Control Handlers ---

    // This event starts the entire listening session.
    this.eventBus.on(SpeechEvents.RECORD_BUTTON_PRESSED, () => {
      // Prevent starting a new session if one is already active.
      if (!this.isListeningModeActive) {
        this.isListeningModeActive = true;
        this.wakeWordDetector.stop(); // Ensure passive listening is off
        this.nluModule.startListeningSession();
      }
    });

    
    this.eventBus.on(SpeechEvents.WAKE_WORD_DETECTED, () => {
      // Prevent starting if a session is already active.
      if (!this.isListeningModeActive) {
        console.log("CoreModule: Wake word detected, starting active session.");
        this.wakeWordDetector.stop(); // Stop passive listening
        this.isListeningModeActive = true;
        this.nluModule.startListeningSession(); // Start active listening
      }
    });
    // This event stops the entire listening session.
    this.eventBus.on(SpeechEvents.STOP_WORD_DETECTED, () => {
      console.log("CoreModule: Stop word detected, ending session.");
      stopSessionLogic();
    });

    // The stop button now just calls the same shared logic
    this.eventBus.on(SpeechEvents.STOP_BUTTON_PRESSED, () => {
      console.log("CoreModule: Stop button pressed, ending session.");
      stopSessionLogic();
    });

    const stopSessionLogic = () => {
      // Only act if a session is currently active.
      if (this.isListeningModeActive) {
        this.isListeningModeActive = false;
        this.nluModule.forceStopSession();
        // After stopping, return to passively listening for the wake word.
        this.wakeWordDetector.start();
      }
    };
    this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
      this.wakeWordDetector.checkForStopWord(transcription);
    });

    // --- Internal State and UI Update Handlers ---

    this.eventBus.on(SpeechEvents.LISTEN_STARTED, () => {
        // This is the initial state when a session begins.
        this.status.set(StatusType.LISTENING); // A new status for the UI
        this.uiHandler.updateUIStatus();
    });

    this.eventBus.on(SpeechEvents.RECORDING_STARTED, () => {
      this.isRecordingModeActive = true;
      this.status.set(StatusType.RECORDING);
      this.uiHandler.updateUIStatus();
    });

    this.eventBus.on(SpeechEvents.RECORDING_STOPPED, () => {
        this.isRecordingModeActive = false;
        // If we are still in listening mode, we should not change the status.
        // The VAD will continue to run and listen for wake words.
        if (this.isListeningModeActive) {
            this.status.set(StatusType.LISTENING);
        } else {
            this.status.set(StatusType.IDLE);
        }
        this.uiHandler.updateUIStatus();  
      // if (this.isListeningModeActive) {
      //   this.status.set(StatusType.PROCESSING);
      //   this.uiHandler.updateUIStatus();
      // }
    });

    this.eventBus.on(SpeechEvents.LISTENING_STOPPED, () => {
        this.status.set(StatusType.IDLE);
        console.log('Listening session stopped.');
        this.uiHandler.updateUIStatus();
    });

    // This handler is the key to the continuous loop.
    const onActionFinished = () => {
      // After processing a command, check if we should continue listening.
      if (this.isListeningModeActive && !this.isRecordingModeActive)  {
        // If so, just reset the status. The VAD is still running.
        console.log('[INTERRUPT] Continuing listening mode after action completion.');
        this.status.set(StatusType.LISTENING);
        this.uiHandler.updateUIStatus();
      }
      // If isListeningModeActive is false, the user must have pressed "STOP".
      // In that case, the STOP_BUTTON_PRESSED handler has already reset the state to IDLE.
    };

    this.eventBus.on(SpeechEvents.ACTUATOR_COMPLETED, onActionFinished);

    this.eventBus.on(SpeechEvents.ERROR_OCCURRED, (error: Error) => {
        console.error('VoiceLib error:', error);
        this.status.set(StatusType.ERROR, error.message);
        this.uiHandler.updateUIStatus();
        // After an error, pause briefly, then return to listening if active.
        setTimeout(onActionFinished, 2000);
    });

    // --- Data Pipeline Handlers ---

    // this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
    //   this.uiHandler.setTranscription(transcription);
    //   console.log('Transcription completed:', transcription);
    // });

    this.eventBus.on(SpeechEvents.NLU_COMPLETED, async (intents: IntentResult[]) => {
      console.log('Going to execute intents:');
      // Status is already PROCESSING, can simplify by removing EXECUTING state
      if (this.isListeningModeActive && !this.isRecordingModeActive)  {
        this.status.set(StatusType.EXECUTING);
        this.uiHandler.updateUIStatus();
      }
      try {
        const actionPerformed = await this.voiceActuator.performAction(intents);
        if (!actionPerformed) {
          ;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, err);
      }
      if(this.status.get().value === StatusType.EXECUTING) {
        this.eventBus.emit(SpeechEvents.ACTUATOR_COMPLETED);
      }
    });
  }
}