import { Constant } from "../common/constants";
import { Validator } from "./validator";
import { VoiceKomConfig } from "../types";
import { Logger } from "./logger";

export class ConfigValidatorAndBuilder {
    private static readonly logger = Logger.getInstance();
    private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
    private static readonly DEFAULT_TIMEOUT = 5000;
    private static readonly DEFAULT_AUTO_START = false;
    private static readonly DEFAULT_SHOW_PROGRESS = true;
    private static readonly DEFAULT_SHOW_TRANSCRIPTION = true;

    private static validateConfigSection(sectionConfig: { provider?: string; apiKey?: string } | undefined, sectionName: string,
        validProviders: string[], errors: string[]): { hasValidConfig: boolean; shouldUseDefaults: boolean } {
        if (!sectionConfig || Object.keys(sectionConfig).length === 0) {
            return { hasValidConfig: true, shouldUseDefaults: true };
        }

        const { provider, apiKey } = sectionConfig;
        if (provider !== undefined) {
            if (!this.validateProviderDataType(provider, sectionName, errors)) {
                return { hasValidConfig: false, shouldUseDefaults: false };
            }
            if (!this.validateProviderValue(provider, validProviders, sectionName, errors)) {
                return { hasValidConfig: false, shouldUseDefaults: false };
            }
        }
        if (apiKey !== undefined && !this.validateApiKeyDataType(apiKey, sectionName, errors)) {
            return { hasValidConfig: false, shouldUseDefaults: false };
        }
        return this.setValidationRules(provider, apiKey, sectionName, errors);
    }

    private static validateProviderDataType(provider: any, sectionName: string, errors: string[]): boolean {
        if (!Validator.isString(provider)) {
            errors.push(`${sectionName} provider must be a string`);
            return false;
        }
        return true;
    }

    private static validateProviderValue(provider: string, validProviders: string[], sectionName: string, errors: string[]): boolean {
        const providerResult = Validator.isInValues(provider, validProviders, `${sectionName}.provider`);
        if (!providerResult.valid && providerResult.message !== undefined) {
            errors.push(providerResult.message);
            return false;
        }
        return true;
    }

    private static validateApiKeyDataType(apiKey: any, sectionName: string, errors: string[]): boolean {
        if (!Validator.isString(apiKey)) {
            errors.push(`${sectionName} apiKey must be a string`);
            return false;
        }
        return true;
    }

    private static setValidationRules(provider: string | undefined, apiKey: string | undefined, sectionName: string,
        errors: string[]): { hasValidConfig: boolean; shouldUseDefaults: boolean } {
        const hasProvider = provider !== undefined;
        const hasApiKey = apiKey !== undefined;

        if (hasApiKey && !hasProvider) {
            errors.push(`${sectionName} configuration requires provider when apiKey is specified`);
            return { hasValidConfig: false, shouldUseDefaults: false };
        }
        if (hasProvider && !hasApiKey) {
            if (provider == Constant.DEFAULT_TRANSCRIPTION_PROVIDER) {
                return { hasValidConfig: true, shouldUseDefaults: true };
            } else {
                errors.push(`${sectionName} configuration requires apiKey for provider: ${provider}`);
                return { hasValidConfig: false, shouldUseDefaults: false };
            }
        }
        if (hasProvider && hasApiKey) {
            if (provider == Constant.DEFAULT_TRANSCRIPTION_PROVIDER) {
                return { hasValidConfig: true, shouldUseDefaults: true };
            } else {
                return { hasValidConfig: true, shouldUseDefaults: false };
            }
        }
        return { hasValidConfig: true, shouldUseDefaults: true };
    }

    private static generateFinalConfiguration(config: VoiceKomConfig, transcriptionValidation: { hasValidConfig: boolean; shouldUseDefaults: boolean },
        recognitionValidation: { hasValidConfig: boolean; shouldUseDefaults: boolean }): any {
        return {
            transcriptionConfig: {
                lang: config.lang ?? Constant.DEFAULT_LANG,
                provider: transcriptionValidation.shouldUseDefaults ? Constant.DEFAULT_TRANSCRIPTION_PROVIDER : config.transcription?.provider,
                apiKey: transcriptionValidation.shouldUseDefaults ? undefined : config.transcription?.apiKey,
                apiUrl: config.transcription?.apiUrl,
                model: config.transcription?.model,
                confidence: config.transcription?.confidence,
                options: config.transcription?.options,
            },
            recognitionConfig: {
                lang: config.lang ?? Constant.DEFAULT_LANG,
                provider: recognitionValidation.shouldUseDefaults ? Constant.DEFAULT_RECOGNITION_PROVIDER : config.recognition?.provider,
                apiKey: recognitionValidation.shouldUseDefaults ? undefined : config.recognition?.apiKey,
                apiUrl: config.recognition?.apiUrl,
                model: config.recognition?.model,
                confidence: config.recognition?.confidence,
            },
            uiConfig: {
                widgetId: config.widgetId ?? Constant.DEFAULT_WIDGET_ID,
                autoStart: config.autoStart ?? this.DEFAULT_AUTO_START,
                position: config.position ?? Constant.DEFAULT_WIDGET_POSITION,
                width: config.width ?? Constant.DEFAULT_WIDGET_WIDTH,
                height: config.height ?? Constant.DEFAULT_WIDGET_HEIGHT,
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
            wakeWords: config.wakeWords,
            sleepWords: config.sleepWords
        };
    }

    public static validateAndGenerateConfig(config: VoiceKomConfig): { finalConfig: any, errors: string[] } {
        console.log("ConfigValidatorAndBuilder validateAndGenerateConfig()...");
        
        const errors: string[] = [];
        Validator.validateOptional(config.widgetId, Validator.isString, 'Widget Id must be a string', errors);
        Validator.validateOptional(config.lang, Validator.isString, 'Language must be a string', errors);
        Validator.validateOptional(config.retries, Validator.isNum, 'Retries must be a number', errors);
        Validator.validateOptional(config.timeout, Validator.isNum, 'Timeout must be a number', errors);

        if ((config.lang ?? 'en') != 'en' && (!config.recognition || config.recognition?.provider == 'default')) {
            errors.push('Invalid configuration: default recognition provider is only supported for English');
        }

        if (config.position) {
            const positionResult = Validator.isInValues(config.position, Constant.VALID_UI_POSITIONS, 'position');
            if (!positionResult.valid) {
                this.logger.error(`Invalid position configuration: ${positionResult.message}`);
                config.position = Constant.DEFAULT_WIDGET_POSITION;
            }
        }
        if (config.width) {
            const widthResult = Validator.isValidPixelValue(config.width ?? Constant.DEFAULT_WIDGET_WIDTH, Constant.DEFAULT_WIDGET_WIDTH);
            if (!widthResult.valid) {
                this.logger.error(`Invalid widget width. ${widthResult.message}`);
                config.width = Constant.DEFAULT_WIDGET_WIDTH;
            }
        }
        if (config.height) {
            const heightResult = Validator.isValidPixelValue(config.height ?? Constant.DEFAULT_WIDGET_HEIGHT, Constant.DEFAULT_WIDGET_HEIGHT);
            if (!heightResult.valid) {
                this.logger.error(`Invalid widget height. ${heightResult.message}`);
                config.height = Constant.DEFAULT_WIDGET_HEIGHT;
            }
        }
        if (config.transcription) {
            Validator.validateOptional(config.transcription.model, Validator.isString, 'Transcription model must be a string', errors);
            Validator.validateOptional(config.transcription.apiUrl, Validator.isString, 'Transcription apiUrl must be a string', errors);
            Validator.validateOptional(config.transcription.confidence, Validator.isNum, 'Transcription confidence must be a number', errors);
        }
        if (config.recognition) {
            Validator.validateOptional(config.recognition.model, Validator.isString, 'Recognition model must be a string', errors);
            Validator.validateOptional(config.recognition.apiUrl, Validator.isString, 'Recognition apiUrl must be a string', errors);
            Validator.validateOptional(config.recognition.confidence, Validator.isNum, 'Recognition confidence must be a number', errors);
        }
        if (config.ui) {
            Validator.validateOptional(config.ui.url, Validator.isValidUrl, 'ui.url must be a valid URL', errors);
        }

        const transcriptionValidation = this.validateConfigSection(config.transcription, 'transcription', Constant.VALID_PROVIDERS, errors);
        const recognitionValidation = this.validateConfigSection(config.recognition, 'recognition', Constant.VALID_PROVIDERS, errors);

        if (!transcriptionValidation.hasValidConfig || !recognitionValidation.hasValidConfig) {
            return { finalConfig: null, errors };
        }
        const finalConfig = this.generateFinalConfiguration(config, transcriptionValidation, recognitionValidation);
        console.log("ConfigValidatorAndBuilder validateAndGenerateConfig() END...");
        return { finalConfig, errors };
    }
} 