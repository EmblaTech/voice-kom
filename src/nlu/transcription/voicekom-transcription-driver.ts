import { TranscriptionDriver } from "./driver";
import { TranscriptionConfig } from "../../types";
import { Logger } from "../../utils/logger";
import { HeaderHandler } from '../../common/header-handler';

export class VoiceKomTranscriptionDriver implements TranscriptionDriver {
  private readonly logger = Logger.getInstance();
  private baseUrl: string;
  private apiKey: string;
  private temperature?: number;
  private headerHandler: HeaderHandler;

  constructor(config: TranscriptionConfig) {
    if (!config.apiKey) {
        throw new Error('API key is required for VoiceKom transcription provider');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = 'http://localhost:3000/api/v1';
    this.temperature = config.temperature;
    this.headerHandler = new HeaderHandler();
  }

  async transcribe(audioFile: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    this.headerHandler.clearHeaders();
    this.headerHandler.setHeaders('X-Client-ID', this.apiKey);
    this.headerHandler.setHeaders('X-Transcription-Temperature', this.temperature);

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      headers: this.headerHandler.getHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.data.transcription;
  }

  getAvailableLanguages(): string[] {
    return ['en']; // Return supported languages
  }
}