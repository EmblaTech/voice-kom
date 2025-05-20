import { UIHandler } from '../ui/ui-handler';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { CoreConfig } from './model/coreConfig';
import { IntentResult } from '../types';
export class CoreModule {
  
  constructor(
    //private nlpModule: INLPModule,
    private uiHandler: UIHandler,
    private eventBus: EventBus,
    private status: Status,
    //private voiceActuator: IVoiceActuator
  ) {}
  
  public async init(config: CoreConfig): Promise<void> {
    await this.uiHandler.init(config.uiConfig);  
    // Initialize NLP module
    //await this.nlpModule.init(config.nlp || {});
    this.bindEvents();
    
    // Set initial state
    this.status.set(StatusType.IDLE);
    this.uiHandler.updateFromState();
  }

  private bindEvents(): void {
    this.eventBus.on(SpeechEvents.RECORD_BUTTON_CLICKED, () => {
      this.startListening();
    });
    
    this.eventBus.on(SpeechEvents.STOP_BUTTON_CLICKED, () => {
      // Check recording state before stopping
      const state = this.status.get();
      if (state.recordingStatus === StatusType.RECORDING) {
        this.stopListening();
      }
    });
    
    // Set up recording events listeners
    this.eventBus.on(SpeechEvents.RECORDING_STARTED, () => {
      // Update state when recording starts
      this.status.set(StatusType.RECORDING);
      // Update UI
      this.uiHandler.updateFromState();
    });
    
    // Handle recording stopped event
    this.eventBus.on(SpeechEvents.RECORDING_STOPPED, () => {
      // Update state to processing when recording stops
      this.status.set(StatusType.PROCESSING);
      // Update UI
      this.uiHandler.updateFromState();
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
      this.uiHandler.updateFromState();
      
      // Try to perform the action
      //const actionPerformed = this.voiceActuator.performAction(intent);
      
      //if (!actionPerformed) {
      //  console.log('No action was performed for intent:', intent);
      //}
    });
    
    // Handle action performed event
    this.eventBus.on(SpeechEvents.ACTION_PERFORMED, (actionResult) => {
      console.log('Action performed:', actionResult);
      
      // Update state to idle after action is completed
      this.status.set(StatusType.IDLE);
      this.uiHandler.updateFromState();
    });
    this.eventBus.on(SpeechEvents.ACTION_PAUSED, (actionResult) => {
      console.log('Action paused:', actionResult);
      
      // Update state to idle after action is completed
      this.status.set(StatusType.IDLE);
      this.uiHandler.updateFromState();
    });
    // Handle errors
    this.eventBus.on(SpeechEvents.ERROR_OCCURRED, (error: Error) => {
      console.error('VoiceLib error:', error);
      this.status.set(StatusType.ERROR, error.message);
      this.uiHandler.updateFromState();
    });
  }
  
  public startListening(): void {
    const state = this.status.get();
    if (state.recordingStatus !== StatusType.RECORDING) {
      //this.nlpModule.startListening();
    }
  }
  
  public stopListening(): void {
    const state = this.status.get();
    if (state.recordingStatus == StatusType.RECORDING) {
      //this.nlpModule.stopListening();
    }
  }
}