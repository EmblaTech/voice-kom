// nlp-module.ts
import { injectable, inject } from 'inversify';
import { INLPModule, INLUDriver, IAudioCapturer, ISTTDriver, CommandRegistry, TYPES, CommandIntent } from '../types';
import { EventBus, VoiceLibEvents } from '../eventbus';
import { StateStore } from '../stateStore';

@injectable()
export class NLPModule implements INLPModule {
  private commandRegistry: CommandRegistry | null = null;
  private language: string = 'en';
  constructor(
    @inject(TYPES.AudioCapturer) private audioCapturer: IAudioCapturer,
    @inject(TYPES.STTDriver) private sttDriver: ISTTDriver,
    @inject(TYPES.NLUDriver) private nluDriver: INLUDriver,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore,

  ) {}
  
  public async init(config: { 
    language?: string, 
    apiKey?: string, 
    }): Promise<void> {

    // if(config.language) this.language = config.language;
    // this.commandRegistry = this.getCommands();
    
    // Initialize the STT driver with language and optional API key
    this.sttDriver.init({
      language: config.language || this.language,
      apiKey: config.apiKey
    });

    // Initialize the NLU driver with language and command registry
    this.commandRegistry = this.getCommands();
    this.nluDriver.init({
      language: config.language || this.language,
      commandRegistry: this.commandRegistry || undefined
    });
  }

  
  public startListening(): void {
    // Start audio capture
    this.audioCapturer.startRecording();
    this.eventBus.emit(VoiceLibEvents.RECORDING_STARTED);
  }
  
  public async stopListening(): Promise<void> {
    try {
      // Stop audio capture and get audio blob directly
      const audioBlob = await this.audioCapturer.stopRecording();
      this.eventBus.emit(VoiceLibEvents.RECORDING_STOPPED);
            
      try {
        // Transcribe the audio using the STT driver
        const transcription = await this.sttDriver.transcribe(audioBlob);
        this.eventBus.emit(VoiceLibEvents.TRANSCRIPTION_COMPLETED, transcription);

        // Identify intent using the NLU driver
        const intentResult = this.nluDriver.identifyIntent(transcription);
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