import { injectable } from 'inversify';
import { ISTTDriver } from '../types';
import { STTConfig } from './model/nlpConfig';

@injectable()
export class WhisperSTTDriver implements ISTTDriver {
  private language: string = 'en';
  private apiKey: string = 'no';
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
  
  constructor() {
    // Empty constructor - initialization via init method now
  }
  
  // Initialization
  public init(lang: string, config: STTConfig): void {
    // Set API key if provided
    if (lang) {
      this.language = lang;
    }
    // Set API key if provided
    if (config.sttApiKey) {
      this.apiKey = config.sttApiKey;
    } else {
      throw new Error('OpenAI API key is required for Whisper transcription');
    }
  }

  // transcribe
  public async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for Whisper transcription');
    }
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
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
      return data.text;
    } catch (error) {
      console.error('Error during Whisper transcription:', error);
      throw error;
    }
  }
  
  public getAvailableLanguages(): string[] {
    return [...this.availableLanguages];
  }
  
  // Method to change API endpoint (for testing or using compatible services)
  public setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
  }
}