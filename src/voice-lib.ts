import 'reflect-metadata';
import { Container, injectable } from 'inversify';
import { 
  IVoiceLib, 
  ICoreModule, 
  INLPModule, 
  IUIComponent, 
  IAudioCapturer, 
  ISTTDriver,
  TYPES, 
  CommandRegistry,
  IVoiceActuator
} from './types';
import { WebAudioCapturer } from './nlp/audio-capturer';
import { WhisperSTTDriver } from './nlp/sst-driver';
import { NLPModule } from './nlp/nlp-module';
import { UIComponent } from './uicomponent/ui-component';
import { CoreModule } from './core/core-module';
import { EventBus } from './eventbus';
import { StateStore } from './stateStore';
import { CompromiseNLUDriver } from './nlp/nlu-driver';
import { VoiceActuator } from './voiceactuator/voice-actuator';

@injectable()
class VoiceLib implements IVoiceLib {
  private container: Container;
  private coreModule?: ICoreModule;

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
    this.container.bind(TYPES.NLUDriver).to(CompromiseNLUDriver).inSingletonScope();
    this.container.bind<INLPModule>(TYPES.NLPModule).to(NLPModule).inSingletonScope();
    this.container.bind<IUIComponent>(TYPES.UIComponent).to(UIComponent).inSingletonScope();
    this.container.bind<VoiceActuator>(TYPES.VoiceActuator).to(VoiceActuator).inSingletonScope();    
    this.container.bind<ICoreModule>(TYPES.CoreModule).to(CoreModule).inSingletonScope();
  }

  private initializeDependencies(): void {
    if (!this.coreModule) {
      this.coreModule = this.container.get<ICoreModule>(TYPES.CoreModule);
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