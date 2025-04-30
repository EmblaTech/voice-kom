import 'reflect-metadata';
import { Container, injectable } from 'inversify';
import { 
  IVoiceLib, 
  ICoreModule, 
  INLPModule, 
  IUIComponent, 
  IAudioCapturer, 
  ISTTDriver,
  RecordingStatus,
  TYPES 
} from './types';
import { WebAudioCapturer } from './nlp/audio-capturer';
import { WhisperSTTDriver } from './nlp/sst-driver';
import { NLPModule } from './nlp/nlp-module';
import { UIComponent } from './uicomponent/ui-component';
import { CoreModule } from './core/core-module';
import { EventBus } from './eventbus';
import { StateStore } from './stateStore';

// Default API key - in a real app you would handle this more securely
const DEFAULT_API_KEY = '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';

@injectable()
class VoiceLib implements IVoiceLib {
  private container: Container;
  private coreModule?: ICoreModule;
  private stateStore?: StateStore;
  
  constructor() {
    this.container = new Container();
    this.setupDependencies();
  }
  
  private setupDependencies(): void {
    // Register all dependencies
    this.container.bind<EventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
    this.container.bind<StateStore>(TYPES.StateStore).to(StateStore).inSingletonScope();
    this.container.bind<IAudioCapturer>(TYPES.AudioCapturer).to(WebAudioCapturer).inSingletonScope();
    this.container.bind<ISTTDriver>(TYPES.STTDriver).to(WhisperSTTDriver).inSingletonScope();
    this.container.bind<INLPModule>(TYPES.NLPModule).to(NLPModule).inSingletonScope();
    this.container.bind<IUIComponent>(TYPES.UIComponent).to(UIComponent).inSingletonScope();
    this.container.bind<ICoreModule>(TYPES.CoreModule).to(CoreModule).inSingletonScope();
  }

  private initializeDependencies(): void {
    if (!this.coreModule) {
      this.coreModule = this.container.get<ICoreModule>(TYPES.CoreModule);
    }
    
    if (!this.stateStore) {
      this.stateStore = this.container.get<StateStore>(TYPES.StateStore);
    }
  }
  
  public async init(config: { 
    container: HTMLElement; 
    language?: string;
    apiKey?: string; 
  }): Promise<void> {
    // Initialize dependencies before using them
    this.initializeDependencies();
    
    await this.coreModule!.init(
      config.container, 
      { 
        language: config.language, 
        apiKey: config.apiKey
      }
    );
  }
}

// Export singleton instance
const voiceLib = new VoiceLib();
export default voiceLib;