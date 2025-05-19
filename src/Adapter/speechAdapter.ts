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
import { SpeechAdapterConfig } from './model/adapterConfig';

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
  
  public async init(config: SpeechAdapterConfig): Promise<void> {
    // Initialize dependencies before using them
    //this.initializeDependencies();
    const validation = this.validateSpeechAdapterConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    await this.coreModule!.init({
      nlp: {
        lang: config.lang,
        sst: {
          sttEngine: config.transcription?.provider ?? '',
          sttApiKey: config.transcription?.apiKey ?? ''
          //speechEngineParams: config.transcription?.options,
        } 
      },
      ui: {
        containerId: config.containerId,
        autoStart: config.ui?.autoStart,
        position: config.ui?.position,
        width: config.ui?.width,
        height: config.ui?.height,
        theme: config.ui?.theme,
        showProgress: config.ui?.showProgress,
        showTranscription: config.ui?.showTranscription,
        styles: config.ui?.styles
      },
      retryAttempts: config.retries,
      timeout: config.timeout
    });
  }

  // Function to validate the configuration
 private validateSpeechAdapterConfig(config: SpeechAdapterConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation rules
  if (config.containerId && typeof config.containerId !== 'string') {
    errors.push('containerId must be a string');
  }
  
  if (config.lang && typeof config.lang !== 'string') {
    errors.push('language must be a string');
  }
  
  // Validate transcription settings
  if (config.transcription) {
    if (config.transcription.confidence !== undefined && 
        (config.transcription.confidence < 0 || config.transcription.confidence > 1)) {
          errors.push('speechRecognition.confidenceThreshold must be between 0 and 1');
    }
  }
  
  // Validate nlu settings
  if (config.nlu) {
    if (config.nlu.confidence !== undefined && 
        (config.nlu.confidence < 0 || config.nlu.confidence > 1)) {
      errors.push('NLU confidence  must be between 0 and 1');
    }
  }
  
  // Validate UI settings
  if (config.ui) {
    if (config.ui.position && !['top', 'bottom', 'left', 'right', 'center'].includes(config.ui.position)) {
      errors.push('ui.position must be one of: top, bottom, left, right, center');
    }
  }
  
  // Validate connection settings
  if (config.retries !== undefined && 
      (typeof config.retries !== 'number' || config.retries < 0)) {
      errors.push('RetryAttempts must be a positive number');
  }
    
  if (config.timeout !== undefined && 
      (typeof config.timeout !== 'number' || config.timeout < 0)) {
      errors.push('Timeout must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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