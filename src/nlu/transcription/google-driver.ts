import { Logger } from "../../utils/logger";
import { TranscriptionDriver } from "./driver";
import { TranscriptionConfig } from "../../types";

export class GoogleTranscriptionDriver implements TranscriptionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: TranscriptionConfig;
    private language: string = 'en';
    private apiKey: string = '';
    private apiEndpoint: string = 'https://speech.googleapis.com/v1/speech:recognize';
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
        console.log("google-driver.ts constructor()...");
        this.config = config;
        this.language = config.lang || this.language;
        this.apiKey = config.apiKey || '';
        this.logger.info(`GoogleTranscriptionDriver initialized with config: ${JSON.stringify(config)}`);
    }

    /**
     * Initialize the driver with configuration options
     */
    init(lang: string, config: TranscriptionConfig): void {
        console.log("google-driver.ts init()...");
        if (lang) {
            this.language = lang;
        }
        
        if (config.apiKey) {
            this.apiKey = config.apiKey;
        } else {
            throw new Error('Google Speech-to-Text API key is required for transcription');
        }
    }

    /**
     * Transcribe audio blob to text using Google Speech-to-Text API
     */
    async transcribe(rawAudio: Blob): Promise<string> {
        console.log("google-driver.ts transcribe()...");
        if (!this.apiKey) {
            throw new Error('Google Speech-to-Text API key is required for transcription');
        }
        
        try {
            // Convert audio blob to base64
            const arrayBuffer = await rawAudio.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: {
                        encoding: 'WEBM_OPUS',
                        sampleRateHertz: 48000,
                        languageCode: this.language,
                        enableAutomaticPunctuation: true,
                        enableWordTimeOffsets: false,
                        enableWordConfidence: false,
                        model: 'latest_long',
                        useEnhanced: true
                    },
                    audio: {
                        content: base64Audio
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Google Speech-to-Text API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                throw new Error('No transcription results returned from Google Speech-to-Text API');
            }
            
            // Extract the transcribed text from the first result
            const transcription = data.results[0].alternatives[0].transcript;
            this.logger.info(`Transcription completed: ${transcription}`);
            
            return transcription;
        } catch (error) {
            this.logger.error('Error during Google Speech-to-Text transcription:', error);
            throw error;
        }
    }

    /**
     * Get list of available languages supported by Google Speech-to-Text
     */
    getAvailableLanguages(): string[] {
        console.log("google-driver.ts getAvailableLanguages()...");
        return [...this.availableLanguages];
    }

    /**
     * Method to change API endpoint (for testing or using compatible services)
     */
    setApiEndpoint(endpoint: string): void {
        console.log("google-driver.ts setApiEndpoint()...");
        this.apiEndpoint = endpoint;
    }

    /**
     * Get current language setting
     */
    getCurrentLanguage(): string {
        return this.language;
    }
}