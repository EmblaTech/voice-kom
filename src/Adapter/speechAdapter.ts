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
  IVoiceActuator,
  INLUDriver
} from '../types';
import { WebAudioCapturer } from '../nlp/audio-capturer';
import { WhisperSTTDriver } from '../nlp/sst-driver';
import { NLPModule } from '../nlp/nlp-module';
import { UIComponent } from '../uicomponent/ui-component';
import { CoreModule } from '../core/core-module';
import { EventBus } from '../utils/eventbus';
import { StateStore } from '../utils/stateStore';
import { CompromiseNLUDriver } from '../nlp/nlu-driver';
import { VoiceActuator } from '../voiceactuator/voice-actuator';
import { AdapterConfig } from './model/adaperConfig';
import { CommandRegistry } from '../nlp/commandRegistry';
import {LLMNLUDriver} from '../nlp/llm-nlu-driver';
import { NLUDriverFactory } from '../nlp/nlu-driver-factory';

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
    this.container.bind<INLUDriver>(CompromiseNLUDriver).toSelf().inSingletonScope();
    this.container.bind<INLUDriver>(LLMNLUDriver).toSelf().inSingletonScope();
    this.container.bind<INLPModule>(TYPES.NLPModule).to(NLPModule).inSingletonScope();
    this.container.bind<IUIComponent>(TYPES.UIComponent).to(UIComponent).inSingletonScope();
    this.container.bind<VoiceActuator>(TYPES.VoiceActuator).to(VoiceActuator).inSingletonScope();    
    this.container.bind<ICoreModule>(TYPES.CoreModule).to(CoreModule).inSingletonScope();
    this.container.bind<CommandRegistry>(TYPES.CommandRegistry).to(CommandRegistry).inSingletonScope();
 this.container.bind<NLUDriverFactory>(TYPES.NLUDriverFactory).to(NLUDriverFactory).inSingletonScope();

  }

  private initializeDependencies(): void {
    if (!this.coreModule) {
      this.coreModule = this.container.get<ICoreModule>(TYPES.CoreModule);
    }
  }
  
  public async init(config: AdapterConfig): Promise<void> {
    // Initialize dependencies before using them
    this.initializeDependencies();
    
    await this.coreModule!.init({
      nlp: {
        lang: config.lang,
        sst: config.sttEngine ? {
          sttEngine: config.sttEngine,
          sttApiKey: config.sttApiKey,
          speechEngineParams: config.speechEngineParams
        } : undefined,
        nlu: config.nluEngine ? {
          nluEngine: config.nluEngine,
          nluApiKey: config.nluApiKey,
        } : undefined
      },
      ui: {
        containerId: config.containerId,
        container: config.container,
        autoStart: config.autoStart,
        position: config.position,
        width: config.width,
        height: config.height,
        theme: config.theme,
        showProgress: config.showProgress,
        showTranscription: config.showTranscription,
        styles: config.styles
      },
      retryAttempts: config.retryAttempts,
      timeout: config.timeout
    });
  }
}

// Create singleton instance
const voiceLib = new VoiceLib();

// Make sure it's properly exposed for both module systems and global context
if (typeof window !== 'undefined') {
  (window as any).SpeechPlug = voiceLib;
}

// Export as both default and named export for better compatibility
export { voiceLib };
export default voiceLib;