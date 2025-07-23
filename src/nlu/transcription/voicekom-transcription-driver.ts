import { TranscriptionDriver } from "./driver";
import { TranscriptionConfig } from "../../types";
import { Logger } from "../../utils/logger";

export class VoiceKomTranscriptionDriver implements TranscriptionDriver {
  private readonly logger = Logger.getInstance();
  private baseUrl: string;
  private apiKey: string;
  private temperature?: number;

  constructor(config: TranscriptionConfig) {
    if (!config.apiKey) {
        throw new Error('API key is required for VoiceKom transcription provider');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = 'http://localhost:3000/api/v1';
    this.temperature = config.temperature;
  }

  async transcribe(audioFile: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const headers: Record<string, string> = {
      'X-Client-ID': this.apiKey
    };
    
    if (this.temperature !== undefined) {
      headers['X-Transcription-Temperature'] = this.temperature.toString();
    }

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      headers: headers,
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