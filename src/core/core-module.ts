// core-module.ts
import { injectable, inject } from 'inversify';
import { ICoreModule, INLPModule, IUIComponent, RecordingStatus, TYPES } from '../types';
import { EventBus, VoiceLibEvents } from '../eventbus';
import { StateStore } from '../stateStore';

@injectable()
export class CoreModule implements ICoreModule {
  private config: { language: string, apiKey?: string } = { language: 'en' };
  
  constructor(
    @inject(TYPES.NLPModule) private nlpModule: INLPModule,
    @inject(TYPES.UIComponent) private uiComponent: IUIComponent,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore
  ) {}
  
  public async init(container: HTMLElement, config: { language?: string, apiKey?: string }): Promise<void> {
    // Update config with any provided values
    if (config?.language) {
      this.config.language = config.language;
    }
    
    if (config?.apiKey) {
      this.config.apiKey = config.apiKey;
    }
    
    // Initialize UI component
    this.uiComponent.init(container);
    
    // Initialize NLP module with config
    await this.nlpModule.init({
      language: this.config.language,
      apiKey: this.config.apiKey
    });
    
    // Set up UI event listeners through EventBus
    this.eventBus.on(VoiceLibEvents.RECORD_BUTTON_PRESSED, () => {
      this.startListening();
    });
    
    this.eventBus.on(VoiceLibEvents.STOP_BUTTON_PRESSED, () => {
      this.stopListening();
    });
    
    // Set up transcription event listener
    this.eventBus.on(VoiceLibEvents.TRANSCRIPTION_COMPLETED, (transcription: string) => {
      // Here you can add any additional logic when transcription is complete
      console.log('Transcription completed:', transcription);
    });
    
    // Handle errors
    this.eventBus.on(VoiceLibEvents.ERROR_OCCURRED, (error: Error) => {
      console.error('VoiceLib error:', error);
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
    if (state.recordingStatus === RecordingStatus.RECORDING) {
      this.nlpModule.stopListening();
    }
  }
}