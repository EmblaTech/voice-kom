import { UIHandler } from '../ui/ui-handler';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { CoreConfig, IntentResult } from '../types';
import { VoiceActuator } from '../actuator/voice-actuator';
import { NLUModule } from '../nlu/nlu-module';
export class CoreModule {
  
  constructor(
    private readonly nluModule: NLUModule,
    private readonly uiHandler: UIHandler,
    private readonly voiceActuator: VoiceActuator,
    private readonly eventBus: EventBus,
    private readonly status: Status    
  ) {}
  
  public async init(config: CoreConfig): Promise<void> {
    await this.uiHandler.init(config.uiConfig); 
    await this.nluModule.init(config.transcriptionConfig, config.recognitionConfig )
    this.bindEvents();
    
    // Set initial state
    this.status.set(StatusType.IDLE);
    this.uiHandler.updateUIStatus();
  }

  private bindEvents(): void {
    this.eventBus.on(SpeechEvents.RECORD_BUTTON_PRESSED, () => {
      this.startListening();
    });
    
    this.eventBus.on(SpeechEvents.STOP_BUTTON_PRESSED, () => {
      // Check recording state before stopping
      const status = this.status.get();
      if (status.value === StatusType.RECORDING) {
        this.stopListening();
      }
    });
    
    // Set up recording events listeners
    this.eventBus.on(SpeechEvents.RECORDING_STARTED, () => {
      // Update state when recording starts
      this.status.set(StatusType.RECORDING);
      // Update UI
      this.uiHandler.updateUIStatus();
    });
    
    // Handle recording stopped event
    this.eventBus.on(SpeechEvents.RECORDING_STOPPED, () => {
      // Update state to processing when recording stops
      this.status.set(StatusType.PROCESSING);
      // Update UI
      this.uiHandler.updateUIStatus();
    });
    
    // Set up transcription event listener
    this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
      // Set transcription in UI component instead of state
      this.uiHandler.setTranscription(transcription);
      console.log('Transcription completed:', transcription);
    });
    
    // Set up nlu event listener
    this.eventBus.on(SpeechEvents.NLU_COMPLETED, (intent: IntentResult) => {
      console.log('NLU completed:', intent);
      
      // Set state to executing when we have an intent to process
      this.status.set(StatusType.EXECUTING);
      this.uiHandler.updateUIStatus();
      
      // Try to perform the action
      const actionPerformed = this.voiceActuator.performAction(intent);
      
      if (!actionPerformed) {
        console.log('No action was performed for intent:', intent);
      }
    });
    
    // Handle action performed event
    this.eventBus.on(SpeechEvents.ACTION_PERFORMED, (actionResult) => {
      console.log('Action performed:', actionResult);
      
      // Update state to idle after action is completed
      this.status.set(StatusType.IDLE);
      this.uiHandler.updateUIStatus();
    });
    this.eventBus.on(SpeechEvents.ACTION_PAUSED, (actionResult) => {
      console.log('Action paused:', actionResult);
      
      // Update state to idle after action is completed
      this.status.set(StatusType.IDLE);
      this.uiHandler.updateUIStatus();
    });
    // Handle errors
    this.eventBus.on(SpeechEvents.ERROR_OCCURRED, (error: Error) => {
      console.error('VoiceLib error:', error);
      this.status.set(StatusType.ERROR, error.message);
      this.uiHandler.updateUIStatus();
    });
  }
  
  public startListening(): void {
    const status = this.status.get();
    if (status.value !== StatusType.RECORDING) {
      this.nluModule.startListening();
    }
  }
  
  public stopListening(): void {
    const status = this.status.get();
    if (status.value == StatusType.RECORDING) {
      this.nluModule.stopListening();
    }
  }
}