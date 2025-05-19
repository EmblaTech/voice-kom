// Updated core-module.ts
import { injectable, inject } from 'inversify';
import { ICoreModule, INLPModule, IntentResult, IUIComponent, RecordingStatus, TYPES, IVoiceActuator } from '../types';
import { EventBus, VoiceLibEvents } from '../utils/eventbus';
import { StateStore } from '../utils/stateStore';
import { CoreConfig } from './model/coreonfig';
@injectable()
export class CoreModule implements ICoreModule {
  
  constructor(
    @inject(TYPES.NLPModule) private nlpModule: INLPModule,
    @inject(TYPES.UIComponent) private uiComponent: IUIComponent,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore,
    @inject(TYPES.VoiceActuator) private voiceActuator: IVoiceActuator
  ) {}
  
  public async init(config: CoreConfig): Promise<void> {

    this.uiComponent.init(config.ui);
  
    // Initialize NLP module
    await this.nlpModule.init(config.nlp || {});

    // Set up UI event listeners through EventBus
    this.eventBus.on(VoiceLibEvents.RECORD_BUTTON_PRESSED, () => {
      this.startListening();
    });
    
    this.eventBus.on(VoiceLibEvents.STOP_BUTTON_PRESSED, () => {
      // Check recording state before stopping
      const state = this.stateStore.getState();
      if (state.recordingStatus === RecordingStatus.RECORDING) {
        this.stopListening();
      }
    });
    
    // Set up recording events listeners
    this.eventBus.on(VoiceLibEvents.RECORDING_STARTED, () => {
      // Update state when recording starts
      this.stateStore.setRecordingStatus(RecordingStatus.RECORDING);
      // Update UI
      this.uiComponent.updateFromState();
    });
    
    // Handle recording stopped event
    this.eventBus.on(VoiceLibEvents.RECORDING_STOPPED, () => {
      // Update state to processing when recording stops
      this.stateStore.setRecordingStatus(RecordingStatus.PROCESSING);
      // Update UI
      this.uiComponent.updateFromState();
    });
    
    // Set up transcription event listener
    this.eventBus.on(VoiceLibEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
      // Set transcription in UI component instead of state
      this.uiComponent.setTranscription(transcription);
      console.log('Transcription completed:', transcription);
    });
    
    // Set up nlu event listener
    this.eventBus.on(VoiceLibEvents.NLU_COMPLETED, (intent: IntentResult) => {
      console.log('NLU completed:', intent);
      
      // Set state to executing when we have an intent to process
      this.stateStore.setRecordingStatus(RecordingStatus.EXECUTING);
      this.uiComponent.updateFromState();
      
      // Try to perform the action
      const actionPerformed = this.voiceActuator.performAction(intent);
      
      if (!actionPerformed) {
        console.log('No action was performed for intent:', intent);
      }
    });
    
    // Handle action performed event
    this.eventBus.on(VoiceLibEvents.ACTION_PERFORMED, (actionResult) => {
      console.log('Action performed:', actionResult);
      
      // Update state to idle after action is completed
      this.stateStore.setRecordingStatus(RecordingStatus.IDLE);
      this.uiComponent.updateFromState();
    });
    this.eventBus.on(VoiceLibEvents.ACTION_PAUSED, (actionResult) => {
      console.log('Action paused:', actionResult);
      
      // Update state to idle after action is completed
      this.stateStore.setRecordingStatus(RecordingStatus.IDLE);
      this.uiComponent.updateFromState();
    });
    // Handle errors
    this.eventBus.on(VoiceLibEvents.ERROR_OCCURRED, (error: Error) => {
      console.error('VoiceLib error:', error);
      this.stateStore.setError(error);
      this.uiComponent.updateFromState();
    });
    
    // Set initial state
    this.stateStore.setRecordingStatus(RecordingStatus.IDLE);
    this.uiComponent.updateFromState();
  }
  
  public startListening(): void {
    const state = this.stateStore.getState();
    if (state.recordingStatus !== RecordingStatus.RECORDING) {
      this.nlpModule.startListening();
    }
  }
  
  public stopListening(): void {
    const state = this.stateStore.getState();
    if (state.recordingStatus == RecordingStatus.RECORDING) {
      this.nlpModule.stopListening();
    }
  }
}