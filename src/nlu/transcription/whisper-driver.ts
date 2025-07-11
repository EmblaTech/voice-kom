import { Logger } from "../../utils/logger";
import { TranscriptionConfig } from "../../types";
import { TranscriptionDriver } from "./driver";
import { Validator } from "../../utils/validator";

//TODO: Need to set producition server URL
//const DEFAULT_SERVER_URL = 'https://api.speechplug.com'; // real production backend URL
const DEFAULT_SERVER_URL = '';

export class WhisperTranscriptionDriver implements TranscriptionDriver {
    private readonly logger = Logger.getInstance();
    private language: string = 'en';
    //private apiKey: string = '';
    //private apiEndpoint: string = 'https://api.openai.com/v1/audio/transcriptions';
    private backEndpoint!: string;
    private clientId!: string;

    private readonly DEFAULT_LANGUAGE = 'en';
    private readonly DEFAULT_MODEL = 'whisper-1';
    private readonly DEFAULT_TEMPERATURE = '0.0';

    private readonly AVAILABLE_LANGUAGES: string[] = [
        'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja',
        'pt', 'tr', 'pl', 'ca', 'nl', 'ar', 'sv', 'it',
        'id', 'hi', 'fi', 'vi', 'he', 'uk', 'el', 'ms',
        'cs', 'ro', 'da', 'hu', 'ta', 'no', 'th', 'ur',
        'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy', 'sk',
        'te', 'fa', 'lv', 'bn', 'sr', 'az', 'sl', 'kn',
        'et', 'mk', 'br', 'eu', 'is', 'hy', 'ne', 'mn',
        'bs', 'kk', 'sq', 'sw', 'gl', 'mr', 'pa', 'si',
        'km', 'sn', 'yo', 'so', 'af', 'oc', 'ka', 'be',
        'tg', 'sd', 'gu', 'am', 'yi', 'lo', 'uz', 'fo',
        'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my',
        'bo', 'tl', 'mg', 'as', 'tt', 'haw', 'ln', 'ha',
        'ba', 'jw', 'su'
    ];

    constructor(config: TranscriptionConfig, clientId: any, serverUrl: any) {
        this.validateConfig(config, clientId);      
        this.language = config.lang || this.DEFAULT_LANGUAGE;
        //this.apiKey = config.apiKey!;
        //this.apiEndpoint = config.apiUrl || this.apiEndpoint;
        this.clientId = clientId;
        this.backEndpoint = serverUrl || DEFAULT_SERVER_URL;
        this.logger.info(`WhisperTranscriptionDriver initialized with config: ${JSON.stringify(config)}`);
    }

    /**
     * Transcribe audio blob to text using OpenAI Whisper API
     */
    async transcribe(rawAudio: Blob): Promise<string> {
        try {
            const formData = this.buildFormData(rawAudio);
            const response = await fetch(`${this.backEndpoint}/api/execute/whisper-transcribe`, {
                method: 'POST',
                headers: {
                    'X-Client-ID': this.clientId
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
    // setApiEndpoint(endpoint: string): void {
    //     if (!endpoint || !Validator.isValidUrl(endpoint)) {
    //         throw new Error('Invalid API endpoint provided');
    //     }
    //     this.apiEndpoint = endpoint;
    // }

    /**
     * Get current language setting
     */
    getCurrentLanguage(): string {
        return this.language;
    }

    private validateConfig(config: TranscriptionConfig, clientId: any): void {
        // if (!config.apiKey) {
        //     throw new Error('OpenAI API key is required for Whisper transcription');
        // }

        if (config.apiUrl && !Validator.isValidUrl(config.apiUrl)) {
            throw new Error('Invalid API URL provided in configuration');
        }

        if (!clientId) {
            throw new Error("clientId must be provided in the configuration!");
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