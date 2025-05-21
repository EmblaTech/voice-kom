import { Logger } from "../../utils/logger";
import { TranscriptionConfig } from "../../types";
import { TranscriptionDriver } from "./driver";

export class WhisperTranscriptionDriver implements TranscriptionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: TranscriptionConfig;
    constructor(config: TranscriptionConfig) { 
        this.config = config
        //TODO: Move out this into config
        this.config.apiUrl ??= 'https://api.openai.com/v1/audio/transcriptions';        
    }

    async transcribe(rawAudio: Blob): Promise<string> {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required for Whisper transcription');
        } 
        if (!this.config.apiUrl) {
            throw new Error('OpenAI API url is required for Whisper transcription');
        }       
    
        try {
            const formData = new FormData();
            formData.append('file', rawAudio, 'audio.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', this.config.lang ?? 'en');
            
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
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
            this.logger.error('Error during Whisper transcription:', error);
            throw error;
        }
    }
}