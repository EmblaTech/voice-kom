import { VoiceActuator } from "./actuator/voice-actuator";
import { EventBus } from "./common/eventbus";
import { Status } from "./common/status";
import { CoreModule } from "./core/core-module";
import { NLUModule } from "./nlu/nlu-module";
import { RecognitionProvider, VoiceKomConfig, TranscriptionProviders } from "./types";
import { UIHandler } from "./ui/ui-handler";
import { Logger, LogLevel } from "./utils/logger";
import { Validator } from "./utils/validator";
import {WebspeechWakewordDetector} from "./wakeword/WebspeechAPICapturer";

export class VoiceKom {
  private readonly logger = Logger.getInstance();
  private readonly VALID_PROVIDERS = ['default', 'openai', 'google', 'azure', 'webspeech','whisper'];
  private readonly VALID_UI_POSITIONS = ['bottom-left', 'bottom-right'];
  private readonly DEFAULT_WIDGET_ID = 'voice-kom-widget';
  private readonly DEFAULT_LANG = 'en';
  private readonly DEFAULT_TRANSCRIPTION_PROVIDER = TranscriptionProviders.DEFAULT;
  private readonly DEFAULT_RECOGNITION_PROVIDER = RecognitionProvider.DEFAULT;
  private readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private readonly DEFAULT_TIMEOUT = 5000;
  private readonly DEFAULT_LOG_LEVEL = LogLevel.INFO;
  private readonly DEFAULT_WIDGET_POSITION = 'bottom-right';
  private readonly DEFAULT_WIDGET_WIDTH = '300px';
  private readonly DEFAULT_WIDGET_HEIGHT = '75px';
  private readonly DEFAULT_AUTO_START = false;
  private readonly DEFAULT_SHOW_PROGRESS = true;
  private readonly DEFAULT_SHOW_TRANSCRIPTION = true;
  private eventBus!: EventBus;
  private status!: Status;
  private voiceActuator!: VoiceActuator;
  private coreModule!: CoreModule; 
  private nluModule!: NLUModule; 
  private uiHandler!: UIHandler;
  private wakeWordDetector!: WebspeechWakewordDetector;


  constructor() {
    this.injectDependencies();
  }
  
  public async init(config: VoiceKomConfig): Promise<void> {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      this.logger.error(`Invalid configuration: ${validation.errors.join(', ')}`);
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    await this.coreModule.init({
      transcriptionConfig: {
        lang: config.lang ?? this.DEFAULT_LANG,
        provider: config.transcription?.provider ?? this.DEFAULT_TRANSCRIPTION_PROVIDER,
        apiUrl: config.transcription?.apiUrl,
        model: config.transcription?.model,
        confidence: config.transcription?.confidence,
        options: config.transcription?.options,
        apiKey: config.transcription?.apiKey,
      },
      recognitionConfig: {
        lang: config.lang ?? this.DEFAULT_LANG,
        provider: config.recognition?.provider ?? this.DEFAULT_RECOGNITION_PROVIDER,
        apiUrl: config.recognition?.apiUrl,
        model: config.recognition?.model,
        confidence: config.recognition?.confidence,
        apiKey: config.recognition?.apiKey,
      },
      uiConfig: {
        widgetId: config.widgetId ?? this.DEFAULT_WIDGET_ID,
        autoStart: config.autoStart ?? this.DEFAULT_AUTO_START,
        position: config.position ?? this.DEFAULT_WIDGET_POSITION,
        width: config.width ?? this.DEFAULT_WIDGET_WIDTH,
        height: config.height ?? this.DEFAULT_WIDGET_HEIGHT,
        theme: config.theme,
        showProgress: config.showProgress ?? this.DEFAULT_SHOW_PROGRESS,
        showTranscription: config.showTranscription ?? this.DEFAULT_SHOW_TRANSCRIPTION,
        styles: config.ui?.styles,
        styleUrl: config.ui?.url
      },
      actuatorConfig: { 
        retries: config.retries,
        timeout: config.timeout
      },
      wakeWords: config.wakeWords,
      clientId: config.clientId
    });
  }

  private injectDependencies() {
    this.eventBus = new EventBus();
    this.status = new Status();

    this.wakeWordDetector = new WebspeechWakewordDetector(this.eventBus);
    this.voiceActuator = new VoiceActuator(this.eventBus);
    this.uiHandler = new UIHandler(this.eventBus, this.status);
    this.nluModule = new NLUModule(this.eventBus, this.status);
    this.coreModule = new CoreModule(this.nluModule, this.uiHandler, this.voiceActuator, this.eventBus, this.status, this.wakeWordDetector);
  }
  // Function to validate the configuration
 private validateConfig(config: VoiceKomConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Validator.isStringOrUndefined(config.widgetId)) {
      errors.push('Widget Id must be a string');
    }  

    if (!Validator.isStringOrUndefined(config.lang)) {
      errors.push('Language must be a string');
    }

    if (!Validator.isNum(config.retries)) {
      errors.push("Retries must be a number");
    }

    if (!Validator.isNum(config.timeout)) {
        errors.push("Timeout must be a number");
    }

    this.validateProviderConfig(config.transcription, "Transcription", errors);
    this.validateProviderConfig(config.recognition, "Recognition", errors);
    this.validateUIConfig(config, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateProviderConfig(providerConfig: any, type: string, errors: string[]) {
    if (!providerConfig) return;

    const providerResult = Validator.isInValues(providerConfig.provider, this.VALID_PROVIDERS, 'Speech Provider');
    if (!providerResult.valid && providerResult.message) {
        errors.push(providerResult.message);
    }
    if (!Validator.isStringOrUndefined(providerConfig.apiUrl)) errors.push(`${type}.apiUrl must be a string`);
    if (!Validator.isStringOrUndefined(providerConfig.apiKey)) errors.push(`${type}.apiKey must be a string`);
    if (!Validator.isStringOrUndefined(providerConfig.model)) errors.push(`${type}.model must be a string`);

    const confidenceResult = Validator.isInRange(providerConfig.confidence, 0, 1, 'Provider confidence')
    if (!confidenceResult.valid && confidenceResult.message) {
        errors.push(confidenceResult.message);
    }
  }

  private validateUIConfig(config: VoiceKomConfig, errors:string[]){
      if (!Validator.isBoolean(config.autoStart)) errors.push("AutoStart must be a boolean");          

      const widthResult = Validator.isValidPixelValue(config.width, this.DEFAULT_WIDGET_WIDTH);
      if (!widthResult.valid) {
          this.logger.error(`Invalid widget width. ${widthResult.message}`);
          config.width = this.DEFAULT_WIDGET_WIDTH;
      }

      const heightResult = Validator.isValidPixelValue(config.height, this.DEFAULT_WIDGET_HEIGHT);
      if (!heightResult.valid) {
          this.logger.error(`Invalid widget height. ${heightResult.message}`);
          config.height = this.DEFAULT_WIDGET_HEIGHT;
      }
      
      if (!Validator.isStringOrUndefined(config.theme)) errors.push("Container theme must be a string");
      if (!Validator.isBoolean(config.showProgress)) errors.push("ShowProgress must be a boolean");
      if (!Validator.isBoolean(config.showTranscription)) errors.push("ShowTranscription must be a boolean");
      if (!Validator.isObject(config.ui?.styles)) errors.push("Container styles must be an object");

      const positionResult = Validator.isInValues(config.position, this.VALID_UI_POSITIONS, 'Container position');
      if (!positionResult.valid && positionResult.message) {
          this.logger.error(`Invalid position configuration: ${positionResult.message}`);
          config.position = this.DEFAULT_WIDGET_POSITION;
      }     
  }
}

// Create singleton instance
const voiceKom = new VoiceKom();

// Make sure it's properly exposed for both module systems and global context
if (typeof window !== 'undefined') {
  (window as any).SpeechPlug = voiceKom;
}

// Export as both default and named export for better compatibility
export { voiceKom };
export default voiceKom;