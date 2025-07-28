import { IntentResult, RecognitionConfig } from "../../types";
import { TranscriptionConfig } from "../../types";
import { HeaderHandler } from '../../common/header-handler';
import { Validator } from "../../utils/validator";

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
  private headerHandler: HeaderHandler;
  constructor(transconfig: TranscriptionConfig, recogconfig: RecognitionConfig) {
    if (!Validator.isString(transconfig.apiKey) || !Validator.isString(recogconfig.apiKey)) {
      throw new Error('A valid API key (string) is required for both transcription and recognition when using the VoiceKom provider.');
    }
    
    if (Validator.isEmpty(transconfig.apiKey) || Validator.isEmpty(recogconfig.apiKey)) {
      throw new Error('API key is required and cannot be empty for the VoiceKom provider.');
    }

    if (transconfig.apiKey === recogconfig.apiKey) {
      this.apiKey = transconfig.apiKey as string;
    } else {
      throw new Error('API keys must match for transcription and recognition when using VoiceKom provider');
    }
    this.baseUrl = process.env.VOICEKOM_API_BASE_URL;
    this.transTemp = transconfig.temperature; 
    this.recogTemp = recogconfig.temperature; 
    this.headerHandler = new HeaderHandler();
  }

  async getIntentFromAudio(audioFile: File | Blob): Promise<BackendResponse['data']> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    this.headerHandler.clearHeaders();
    this.headerHandler.setHeaders('X-Client-ID', this.apiKey);
    this.headerHandler.setHeaders('X-Transcription-Temperature', this.transTemp);
    this.headerHandler.setHeaders('X-Recognition-Temperature', this.recogTemp);

    const response = await fetch(`${this.baseUrl}/intent/audio`, {
      method: 'POST',
      headers: this.headerHandler.getHeaders(),
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