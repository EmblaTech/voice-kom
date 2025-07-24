import { RecognitionDriver } from './driver';
import { RecognitionConfig, IntentResult } from '../../types';
import { Logger } from '../../utils/logger';
import { HeaderHandler } from '../../common/header-handler';

interface IntentFromTextResponse {
  success: boolean;
  data: IntentResult[];
}

export class VoiceKomRecognitionDriver extends HeaderHandler implements RecognitionDriver {
  private readonly logger = Logger.getInstance();
  private baseUrl: string;
  private apiKey: string;
  private temperature?: number;

  constructor(config: RecognitionConfig) {
    super();
    if (!config.apiKey) {
        throw new Error('API key is required for VoiceKom transcription provider');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.apiUrl || 'http://localhost:3000/api/v1'; 
    this.temperature = config.temperature;
  }

  async detectIntent(text: string): Promise<IntentResult[]> {
    if (!text) {
      this.logger.warn('detectIntent called with empty text.');
      return [];
    }
    
    this.logger.info(`Sending text to backend for intent recognition: "${text}"`);

    this.setHeaders('Content-Type', 'application/json');
    this.setHeaders('X-Client-ID', this.apiKey);
    this.setHeaders('X-Recognition-Temperature', this.temperature);

    const response = await fetch(`${this.baseUrl}/intent/text`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text })
    });

    this.clearHeaders();

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting intent from text: ${response.statusText} - ${errorText}`);
    }

    const result: IntentFromTextResponse = await response.json();
    
    if (!result.data) {
        this.logger.warn('Backend response for intent detection is missing a "data" field.');
        return [];
    }

    return result.data;
  }

  // This method is for local drivers, so it can be empty for a backend-driven one.
  getAvailableIntents(): any[] {
    return [];
  }
}