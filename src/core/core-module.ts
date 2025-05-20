import { UIHandler } from '../ui/ui-handler';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { CoreConfig } from './model/coreConfig';
import { INLPModule, IntentResult } from '../types';
import { VoiceActuator } from '../actuator/voice-actuator';
export class CoreModule {
  
  constructor(
    private readonly nluModule: INLPModule,
    private readonly uiHandler: UIHandler,
    private readonly eventBus: EventBus,
    private readonly status: Status,
    private readonly voiceActuator: VoiceActuator
  ) {}
  
  public async init(config: CoreConfig): Promise<void> {
    await this.uiHandler.init(config.uiConfig);  
    // Initialize NLP module
    await this.nluModule.init({
      lang: config.nluConfig?.transcriptionProvider?.lang,
      sst: {
        sttEngine: config.nluConfig?.transcriptionProvider?.name || 'default',
        sttApiKey: config.nluConfig?.transcriptionProvider?.apiKey || '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',
        speechEngineParams: config.nluConfig?.transcriptionProvider?.options
      },
      nlu: {
        nluEngine: config.nluConfig?.recognitionProvider?.name || 'default',
        nluApiKey: config.nluConfig?.recognitionProvider?.apiKey || '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'
      }
    })
    this.bindEvents();
    
    // Set initial state
    this.status.set(StatusType.IDLE);
    this.uiHandler.updateFromState();
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