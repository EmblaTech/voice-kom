// Updated core-module.ts
import { injectable, inject } from 'inversify';
import { ICoreModule, INLPModule, IntentResult, IUIComponent, TYPES, IVoiceActuator } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { CoreConfig } from './model/coreConfig';
@injectable()
export class CoreModule implements ICoreModule {
  
  constructor(
    @inject(TYPES.NLPModule) private nlpModule: INLPModule,
    @inject(TYPES.UIComponent) private uiComponent: IUIComponent,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: Status,
    @inject(TYPES.VoiceActuator) private voiceActuator: IVoiceActuator
  ) {}
  
  public async init(config: CoreConfig): Promise<void> {

    this.uiComponent.init(config.ui);
  
    // Initialize NLP module
    await this.nlpModule.init(config.nlp || {});

    // Set up UI event listeners through EventBus
    this.eventBus.on(SpeechEvents.RECORD_BUTTON_CLICKED, () => {
      this.startListening();
    });
    
    this.eventBus.on(SpeechEvents.STOP_BUTTON_CLICKED, () => {
      // Check recording state before stopping
      const state = this.stateStore.get();
      if (state.recordingStatus === StatusType.RECORDING) {
        this.stopListening();
      }
    });
    
    // Set up recording events listeners
    this.eventBus.on(SpeechEvents.RECORDING_STARTED, () => {
      // Update state when recording starts
      this.stateStore.set(StatusType.RECORDING);
      // Update UI
      this.uiComponent.updateFromState();
    });
    
    // Handle recording stopped event
    this.eventBus.on(SpeechEvents.RECORDING_STOPPED, () => {
      // Update state to processing when recording stops
      this.stateStore.set(StatusType.PROCESSING);
      // Update UI
      this.uiComponent.updateFromState();
    });
    
    // Set up transcription event listener
    this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
      // Set transcription in UI component instead of state
      this.uiComponent.setTranscription(transcription);
      console.log('Transcription completed:', transcription);
    });
    
    // Set up nlu event listener
    this.eventBus.on(SpeechEvents.NLU_COMPLETED, (intent: IntentResult) => {
      console.log('NLU completed:', intent);
      
      // Set state to executing when we have an intent to process
      this.stateStore.set(StatusType.EXECUTING);
      this.uiComponent.updateFromState();
      
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
      this.stateStore.set(StatusType.IDLE);
      this.uiComponent.updateFromState();
    });
    this.eventBus.on(SpeechEvents.ACTION_PAUSED, (actionResult) => {
      console.log('Action paused:', actionResult);
      
      // Update state to idle after action is completed
      this.stateStore.set(StatusType.IDLE);
      this.uiComponent.updateFromState();
    });
    // Handle errors
    this.eventBus.on(SpeechEvents.ERROR_OCCURRED, (error: Error) => {
      console.error('VoiceLib error:', error);
      this.stateStore.set(StatusType.ERROR, error.message);
      this.uiComponent.updateFromState();
    });
    
    // Set initial state
    this.stateStore.set(StatusType.IDLE);
    this.uiComponent.updateFromState();
  }
  
  public startListening(): void {
    const state = this.stateStore.get();
    if (state.recordingStatus !== StatusType.RECORDING) {
      this.nlpModule.startListening();
    }
  }
  
  public stopListening(): void {
    const state = this.stateStore.get();
    if (state.recordingStatus == StatusType.RECORDING) {
      this.nlpModule.stopListening();
    }
  }
}