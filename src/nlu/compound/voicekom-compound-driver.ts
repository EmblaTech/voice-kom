import { IntentResult, RecognitionConfig } from "../../types";
import { TranscriptionConfig } from "../../types";

interface BackendResponse {
  success: boolean;
  data: {
    transcription: string;
    intent: IntentResult[];
  }
}

//This driver is using combined API call which accepts audio and returns the intention 
//in one API call, instead of separate transcription and recognition steps.
// In order to reduce unnecessary API calls and improve performance,
// we are using this compound driver for VoiceKom provider.
export class VoiceKomCompoundDriver {
  private baseUrl: string;
  private apiKey: string;
  private transTemp?: number;
  private recogTemp?: number;

  constructor(transconfig: TranscriptionConfig, recogconfig: RecognitionConfig) {
    if (!transconfig.apiKey || !recogconfig.apiKey) {
      throw new Error('API key is required for VoiceKom provider');
    }

    if (transconfig.apiKey === recogconfig.apiKey) {
      this.apiKey = transconfig.apiKey;
    } else {
      throw new Error('API keys must match for transcription and recognition when using VoiceKom provider');
    }
    this.baseUrl = 'http://localhost:3000/api/v1';
    this.transTemp = transconfig.temperature; 
    this.recogTemp = recogconfig.temperature; 
  }

  async getIntentFromAudio(audioFile: File | Blob): Promise<BackendResponse['data']> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const headers: Record<string, string> = {
      'X-Client-ID': this.apiKey
    };
    
    if (this.transTemp !== undefined) {
      headers['X-Transcription-Temperature'] = this.transTemp.toString();
    }
    
    if (this.recogTemp !== undefined) {
      headers['X-Recognition-Temperature'] = this.recogTemp.toString();
      console.log(`Recognition temperature set to: ${this.recogTemp}`);
    }

    const response = await fetch(`${this.baseUrl}/intent/audio`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting intent: ${response.statusText} - ${errorText}`);
    }

    const result: BackendResponse = await response.json();
    return result.data;
  }
}