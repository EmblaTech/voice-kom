import { RecognitionDriver } from './driver';
import { RecognitionConfig, IntentResult } from '../../types';
import { Logger } from '../../utils/logger';
import { HeaderHandler } from '../../common/header-handler';

interface IntentFromTextResponse {
  success: boolean;
  data: IntentResult[];
}

export class VoiceKomRecognitionDriver implements RecognitionDriver {
  private readonly logger = Logger.getInstance();
  private baseUrl: string;
  private apiKey: string;
  private temperature?: number;
  private headerHandler: HeaderHandler
  ;
  constructor(config: RecognitionConfig) {
    if (!config.apiKey) {
        throw new Error('API key is required for VoiceKom transcription provider');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = process.env.VOICEKOM_API_BASE_URL;
    this.temperature = config.temperature;
    this.headerHandler = new HeaderHandler();
  }

  async detectIntent(text: string): Promise<IntentResult[]> {
    if (!text) {
      this.logger.warn('detectIntent called with empty text.');
      return [];
    }
    
    this.logger.info(`Sending text to backend for intent recognition: "${text}"`);
    this.headerHandler.clearHeaders();
    this.headerHandler.setHeaders('Content-Type', 'application/json');
    this.headerHandler.setHeaders('X-Client-ID', this.apiKey);
    this.headerHandler.setHeaders('X-Recognition-Temperature', this.temperature);

    const response = await fetch(`${this.baseUrl}/intent/text`, {
      method: 'POST',
      headers: this.headerHandler.getHeaders(),
      body: JSON.stringify({ text })
    });

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