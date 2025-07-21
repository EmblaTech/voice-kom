import { VoiceActuator } from "./actuator/voice-actuator";
import { EventBus } from "./common/eventbus";
import { Status } from "./common/status";
import { CoreModule } from "./core/core-module";
import { NLUModule } from "./nlu/nlu-module";
import { ReconitionProvider, VoiceKomConfig, TranscriptionProviders, CoreConfig } from "./types";
import { UIHandler } from "./ui/ui-handler";
import { Logger, LogLevel } from "./utils/logger";
import { Validator } from "./utils/validator";
import { WebspeechWakewordDetector } from "./wakeword/WebspeechAPICapturer";

export class VoiceKom {
    private readonly logger = Logger.getInstance();
    private readonly VALID_PROVIDERS = ['default', 'openai', 'google', 'azure', 'webspeech'];
    private readonly VALID_UI_POSITIONS = ['bottom-left', 'bottom-right'];
    private readonly DEFAULT_LOG_LEVEL = LogLevel.INFO;

    private readonly DEFAULT_WIDGET_ID = 'voice-kom-widget';
    private readonly DEFAULT_LANG = 'en';
    private readonly DEFAULT_TRANSCRIPTION_PROVIDER = TranscriptionProviders.DEFAULT;
    private readonly DEFAULT_RECOGNITION_PROVIDER = ReconitionProvider.DEFAULT;
    private readonly DEFAULT_RETRY_ATTEMPTS = 3;
    private readonly DEFAULT_TIMEOUT = 5000;
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
        // 1. Process, validate, and apply defaults all in one step.
        const { finalConfig, errors } = this.processAndValidateConfig(config);
        // 2. Check if there were any validation errors.
        if (errors.length > 0) {
            const errorMsg = `Invalid configuration: ${errors.join(', ')}`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        // 3. The finalConfig is now guaranteed to be valid and complete.
        await this.coreModule.init(finalConfig);
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

    private processAndValidateConfig(config: VoiceKomConfig): { finalConfig: CoreConfig, errors: string[] } {
        const errors: string[] = [];
        Validator.validateOptional(config.widgetId, Validator.isString, 'Widget Id must be a string', errors);
        Validator.validateOptional(config.lang, Validator.isString, 'Language must be a string', errors);
        Validator.validateOptional(config.retries, Validator.isNum, 'Retries must be a number', errors);
        Validator.validateOptional(config.timeout, Validator.isNum, 'Timeout must be a number', errors);

        const providerResult = Validator.isInValues(config.transcription?.provider, this.VALID_PROVIDERS, 'transcription.provider');
        if (!providerResult.valid && providerResult.message !== undefined) errors.push(providerResult.message);

        const recogProviderResult = Validator.isInValues(config.recognition?.provider, this.VALID_PROVIDERS, 'recognition.provider');
        if (!recogProviderResult.valid && recogProviderResult.message !== undefined) errors.push(recogProviderResult.message);

        if (config.position) {
            const positionResult = Validator.isInValues(config.position, this.VALID_UI_POSITIONS, 'position');
            if (!positionResult.valid) {
                this.logger.error(`Invalid position configuration: ${positionResult.message}`);
                config.position = this.DEFAULT_WIDGET_POSITION;
            }
        }

        if (config.width) {
            const widthResult = Validator.isValidPixelValue(config.width ?? this.DEFAULT_WIDGET_WIDTH, this.DEFAULT_WIDGET_WIDTH);
            if (!widthResult.valid) {
                this.logger.error(`Invalid widget width. ${widthResult.message}`);
                config.width = this.DEFAULT_WIDGET_WIDTH;
            }
        }

        if (config.height) {
            const heightResult = Validator.isValidPixelValue(config.height ?? this.DEFAULT_WIDGET_HEIGHT, this.DEFAULT_WIDGET_HEIGHT);
            if (!heightResult.valid) {
                this.logger.error(`Invalid widget height. ${heightResult.message}`);
                config.height = this.DEFAULT_WIDGET_HEIGHT;
            }
        }

        if (config.transcription) {
            Validator.validateOptional(config.transcription.provider, Validator.isString, 'Transcription provider must be a string', errors);
            Validator.validateOptional(config.transcription.model, Validator.isString, 'Transcription model must be a string', errors);
            Validator.validateOptional(config.transcription.apiUrl, Validator.isString, 'Transcription apiUrl must be a string', errors);
            Validator.validateOptional(config.transcription.confidence, Validator.isNum, 'Transcription confidence must be a number', errors);
        }

        if (config.recognition) {
            Validator.validateOptional(config.recognition.provider, Validator.isString, 'Recognition provider must be a string', errors);
            Validator.validateOptional(config.recognition.apiUrl, Validator.isString, 'Recognition apiUrl must be a string', errors);
            Validator.validateOptional(config.recognition.model, Validator.isString, 'Recognition model must be a string', errors);
            Validator.validateOptional(config.recognition.confidence, Validator.isNum, 'Recognition confidence must be a number', errors);
        }

        if (config.ui) {
            Validator.validateOptional(config.ui.url, Validator.isValidUrl, 'ui.url must be a valid URL', errors);
        }

        // Build the final, complete configuration object by merging user config over defaults.
        const finalConfig = {
            transcriptionConfig: {
                lang: config.lang ?? this.DEFAULT_LANG,
                provider: config.transcription?.provider ?? this.DEFAULT_TRANSCRIPTION_PROVIDER,
                apiUrl: config.transcription?.apiUrl,
                model: config.transcription?.model,
                confidence: config.transcription?.confidence,
                options: config.transcription?.options
            },
            recognitionConfig: {
                lang: config.lang ?? this.DEFAULT_LANG,
                provider: config.recognition?.provider ?? this.DEFAULT_RECOGNITION_PROVIDER,
                apiUrl: config.recognition?.apiUrl,
                model: config.recognition?.model,
                confidence: config.recognition?.confidence
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
                retries: config.retries ?? this.DEFAULT_RETRY_ATTEMPTS,
                timeout: config.timeout ?? this.DEFAULT_TIMEOUT
            },
            wakeWords: config.wakeWords
        };

        return { finalConfig, errors };
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