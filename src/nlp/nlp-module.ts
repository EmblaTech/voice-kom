// nlp-module.ts
import { injectable, inject } from 'inversify';
import { INLPModule, INLUDriver, IAudioCapturer, ISTTDriver, CommandRegistry, TYPES, CommandIntent } from '../types';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { Status, StatusType } from '../common/status';
import { NLPConfig } from './model/nlpConfig';

@injectable()
export class NLPModule implements INLPModule {
  private commandRegistry: CommandRegistry | null = null;
  private language: string = 'en';
  constructor(
    @inject(TYPES.AudioCapturer) private audioCapturer: IAudioCapturer,
    @inject(TYPES.STTDriver) private sttDriver: ISTTDriver,
    @inject(TYPES.NLUDriver) private nluDriver: INLUDriver,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: Status,

  ) {}
  
  public async init(config: NLPConfig): Promise<void> {
    const language = config.lang || this.language;
    
    this.sttDriver.init(
      language,
      config.sst || {
        sttEngine: "default" 
      }
    );
  
    this.commandRegistry = this.getCommands();
    this.nluDriver.init(
      language,
      config.nlu || {
        nluEngine: "default" 
      }
    );
  }

  
  public startListening(): void {
    // Start audio capture
    this.audioCapturer.startRecording();
    this.eventBus.emit(SpeechEvents.RECORDING_STARTED);
  }
  
  public async stopListening(): Promise<void> {
    try {
      // Stop audio capture and get audio blob directly
      const audioBlob = await this.audioCapturer.stopRecording();
      this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);
            
      try {
        // Transcribe the audio using the STT driver
        const transcription = await this.sttDriver.transcribe(audioBlob);
        this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcription);

        // Identify intent using the NLU driver
        const intentResult = this.nluDriver.identifyIntent(transcription);
        this.eventBus.emit(SpeechEvents.NLU_COMPLETED, intentResult);

      } catch (error: any) {
        console.error('Error:', error);
        this.stateStore.set(StatusType.ERROR, error.message);
        this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
      }
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      this.stateStore.set(StatusType.ERROR, error.message);
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, error);
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