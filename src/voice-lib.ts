// voice-lib.ts
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
import { EventStore } from './eventstore';

// Default API key - in a real app you would handle this more securely
const DEFAULT_API_KEY = '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';

@injectable()
class VoiceLib implements IVoiceLib {
  private container: Container;
  private coreModule: ICoreModule;
  private eventStore: EventStore;
  
  constructor() {
    this.container = new Container();
    this.setupDependencies();
    this.coreModule = this.container.get<ICoreModule>(TYPES.CoreModule);
    this.eventStore = this.container.get<EventStore>(TYPES.EventStore);
  }
  
  private setupDependencies(): void {
    // Register EventStore first (as other components depend on it)
    this.container.bind<EventStore>(TYPES.EventStore).to(EventStore).inSingletonScope();
    
    // Register other dependencies
    this.container.bind<IAudioCapturer>(TYPES.AudioCapturer).to(WebAudioCapturer).inSingletonScope();
    this.container.bind<ISTTDriver>(TYPES.STTDriver).to(WhisperSTTDriver).inSingletonScope();
    this.container.bind<INLPModule>(TYPES.NLPModule).to(NLPModule).inSingletonScope();
    this.container.bind<IUIComponent>(TYPES.UIComponent).to(UIComponent).inSingletonScope();
    this.container.bind<ICoreModule>(TYPES.CoreModule).to(CoreModule).inSingletonScope();
  }
  
  public async init(config: { 
    container: HTMLElement; 
    language?: string;
    apiKey?: string; 
  }): Promise<void> {
    
    await this.coreModule.init(
      config.container, 
      { 
        language: config.language, 
        apiKey: config.apiKey
      }
    );
  }
  
  public startListening(): void {
    this.coreModule.startListening();
  }
  
  public stopListening(): void {
    this.coreModule.stopListening();
  }
  
  public isListening(): boolean {
    return this.eventStore.getState().recordingStatus === RecordingStatus.RECORDING;
  }
}

// Export singleton instance
const voiceLib = new VoiceLib();
export default voiceLib;