import { Logger } from "../../utils/logger";
import { TranscriptionConfig } from "../../types";
import { TranscriptionDriver } from "./driver";

export class WhisperTranscriptionDriver implements TranscriptionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: TranscriptionConfig;
    private language: string = 'en';
    private apiKey: string = '';
    private apiEndpoint: string = 'https://api.openai.com/v1/audio/transcriptions';
    private availableLanguages: string[] = [
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

    constructor(config: TranscriptionConfig) { 
        console.log("whisper-driver.ts constructor()...");
        this.config = config;
        this.language = config.lang || this.language;
        this.apiKey = config.apiKey || '';
        this.apiEndpoint = config.apiUrl || this.apiEndpoint;
        this.logger.info(`WhisperTranscriptionDriver initialized with config: ${JSON.stringify(config)}`);
    }

    /**
     * Initialize the driver with configuration options
     */
    init(lang: string, config: TranscriptionConfig): void {
        console.log("whisper-driver.ts init()...");
        if (lang) {
            this.language = lang;
        }
        
        if (config.apiKey) {
            this.apiKey = config.apiKey;
        } else {
            throw new Error('OpenAI API key is required for Whisper transcription');
        }
        
        if (config.apiUrl) {
            this.apiEndpoint = config.apiUrl;
        }
    }

    /**
     * Transcribe audio blob to text using OpenAI Whisper API
     */
    async transcribe(rawAudio: Blob): Promise<string> {
        console.log("whisper-driver.ts transcribe()...");
        if (!this.apiKey) {
            throw new Error('OpenAI API key is required for Whisper transcription');
        } 
        if (!this.apiEndpoint) {
            throw new Error('OpenAI API url is required for Whisper transcription');
        }       
    
        try {
            const formData = new FormData();
            formData.append('file', rawAudio, 'audio.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', this.language);
            // Add prompt to improve name recognition
            // Add temperature parameter for more precise transcription
            formData.append('temperature', '0.0');
            // Request word-level timestamps for better segmentation
            formData.append('timestamp_granularities', '["word"]');
            
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
        console.log("whisper-driver.ts getAvailableLanguages()...");
        return [...this.availableLanguages];
    }

    /**
     * Method to change API endpoint (for testing or using compatible services)
     */
    setApiEndpoint(endpoint: string): void {
        console.log("whisper-driver.ts setApiEndpoint()...");
        this.apiEndpoint = endpoint;
    }

    /**
     * Get current language setting
     */
    getCurrentLanguage(): string {
        return this.language;
    }
}