// updated-nlp-module.ts
import { injectable, inject } from 'inversify';
import { INLPModule, INLUDriver, IAudioCapturer, ISTTDriver, CommandRegistry, TYPES, CommandIntent } from '../types';
import { EventBus, VoiceLibEvents } from '../utils/eventbus';
import { StateStore } from '../utils/stateStore';
import { NLPConfig } from './model/nlpConfig';
import { NLUDriverFactory } from './nlu-driver-factory';

@injectable()
export class NLPModule implements INLPModule {
  private commandRegistry: CommandRegistry | null = null;
  private language: string = 'en';
  private nluDriver: INLUDriver | null = null;
  
  constructor(
    @inject(TYPES.AudioCapturer) private audioCapturer: IAudioCapturer,
    @inject(TYPES.STTDriver) private sttDriver: ISTTDriver,
    @inject(TYPES.NLUDriverFactory) private nluDriverFactory: NLUDriverFactory,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore,
  ) {}
  
  public async init(config: NLPConfig): Promise<void> {
    const language = config.lang || this.language;
    this.language = language;
    
    // Initialize STT driver
    this.sttDriver.init(
      language,
      config.sst || {
        sttEngine: "default" 
      }
    );
  
    // Get commands
    this.commandRegistry = this.getCommands();
    
    // Create and initialize the appropriate NLU driver using the factory
    this.nluDriver = this.nluDriverFactory.createDriver(
      language,
      config.nlu || {
        nluEngine: "default" 
      }
    );
  }

  
  public startListening(): void {
    // Start audio capture
    this.audioCapturer.startRecording();
    this.eventBus.emit(VoiceLibEvents.RECORDING_STARTED);
  }
  
  public async stopListening(): Promise<void> {
    if (!this.nluDriver) {
      throw new Error('NLU Driver not initialized');
    }
    
    try {
      // Stop audio capture and get audio blob directly
      const audioBlob = await this.audioCapturer.stopRecording();
      this.eventBus.emit(VoiceLibEvents.RECORDING_STOPPED);
            
      try {
        // Transcribe the audio using the STT driver
        const transcription = await this.sttDriver.transcribe(audioBlob);
        this.eventBus.emit(VoiceLibEvents.TRANSCRIPTION_COMPLETED, transcription);

        // Identify intent using the selected NLU driver
        const intentResult = await this.nluDriver.identifyIntent(transcription);
        this.eventBus.emit(VoiceLibEvents.NLU_COMPLETED, intentResult);

      } catch (error: unknown) {
        console.error('Error:', error);
        this.stateStore.setError(error);
        this.eventBus.emit(VoiceLibEvents.ERROR_OCCURRED, error);
      }
    } catch (error: unknown) {
      console.error('Error stopping recording:', error);
      this.stateStore.setError(error);
      this.eventBus.emit(VoiceLibEvents.ERROR_OCCURRED, error);
    }
  }
  
  public getAvailableLanguages(): string[] {
    return this.sttDriver.getAvailableLanguages();
  }

  private getCommands(): CommandRegistry {
    const commandRegistry = {
      intents: [
        {
          name: "click_element",
          utterances: ["click (target)", "press (target)", "tap (target)"],
          entities: ["target"]
        }
      ]
    };
    return commandRegistry;
  }
}