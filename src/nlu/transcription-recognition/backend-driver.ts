import { IntentResult, RecognitionConfig } from "../../types";
import { TranscriptionConfig } from "../../types";

interface BackendResponse {
  success: boolean;
  data: {
    transcription: string;
    intent: IntentResult[];
  }
}

export class BackendDriver {
  private baseUrl: string;
  private clientId: string;
  private transTemp?: number;
  private recogTemp?: number;

  constructor(transconfig: TranscriptionConfig, recogconfig: RecognitionConfig, clientId: string) {
    this.clientId = clientId;
    this.baseUrl = 'http://localhost:3000/api/v1';
    this.transTemp = transconfig.temperature; 
    this.recogTemp = recogconfig.temperature; 
  }

  async getIntentFromAudio(audioFile: File | Blob): Promise<BackendResponse['data']> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const headers: Record<string, string> = {
      'X-Client-ID': this.clientId
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