import { Logger } from "../../utils/logger";
import { TranscriptionConfig } from "../../types";
import { TranscriptionDriver } from "./driver";
import { Validator } from "../../utils/validator";

export class WhisperTranscriptionDriver implements TranscriptionDriver {
    private readonly logger = Logger.getInstance();
    private language: string = 'en';
    private apiKey: string = '';
    private apiEndpoint: string = 'https://api.openai.com/v1/audio/transcriptions';

    private readonly DEFAULT_LANGUAGE = 'en';
    private readonly DEFAULT_MODEL = 'whisper-1';
    private readonly DEFAULT_TEMPERATURE = '0.0';

    private readonly AVAILABLE_LANGUAGES: string[] = 
    ['af','ar','hy','az','be','bs','bg','ca',
        'zh','hr','cs','da','nl','en','et','fi',
        'fr','gl','de','el','he','hi','hu','is',
        'id','it','ja','kn','kk','ko','lv','lt',
        'mk','ms','mi','mr','ne','no','fa','pl',
        'pt','ro','ru','sr','sk','sl','es','sw',
    'sv','tl','ta','th','tr','uk','ur','vi','cy'];

    constructor(config: TranscriptionConfig) {
        this.validateConfig(config);
        this.language = config.lang? config.lang.split(/[-_]/)[0].toLowerCase() : this.DEFAULT_LANGUAGE;
        this.apiKey = config.apiKey!;
        this.apiEndpoint = config.apiUrl || this.apiEndpoint;
        this.logger.info(`WhisperTranscriptionDriver initialized with config: ${JSON.stringify(config)}`);
    }

    /**
     * Transcribe audio blob to text using OpenAI Whisper API
     */
    async transcribe(rawAudio: Blob): Promise<string> {
        try {
            const formData = this.buildFormData(rawAudio);
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Whisper API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const transcription = data.text;
            this.logger.info(`Transcription completed: ${transcription}`);
            return transcription;
        } catch (error) {
            this.logger.error('Error during Whisper transcription:', error);
            throw error;
        }
    }

    /**
     * Get list of available languages supported by Whisper
     */
    getAvailableLanguages(): string[] {
        return [...this.AVAILABLE_LANGUAGES];
    }

    /**
     * Method to change API endpoint (for testing or using compatible services)
     */
    setApiEndpoint(endpoint: string): void {
        if (!endpoint || !Validator.isValidUrl(endpoint)) {
            throw new Error('Invalid API endpoint provided');
        }
        this.apiEndpoint = endpoint;
    }

    /**
     * Get current language setting
     */
    getCurrentLanguage(): string {
        return this.language;
    }

    private validateConfig(config: TranscriptionConfig): void {
        if (config.apiUrl && !Validator.isValidUrl(config.apiUrl)) {
            throw new Error('Invalid API URL provided in configuration');
        }
        if (config.lang && !this.AVAILABLE_LANGUAGES.includes(config.lang.split(/[-_]/)[0].toLowerCase())) {
            throw new Error(`Unsupported language provided in configuration: ${config.lang}`);
        }
    }

    private buildFormData(rawAudio: Blob): FormData {
        const formData = new FormData();
        formData.append('file', rawAudio, 'audio.webm');
        formData.append('model', this.DEFAULT_MODEL);
        formData.append('language', this.language);
        // Add prompt to improve name recognition
        // Add temperature parameter for more precise transcription
        formData.append('temperature', this.DEFAULT_TEMPERATURE);
        // Request word-level timestamps for better segmentation
        formData.append('timestamp_granularities', '["word"]');
        return formData;
    }
}