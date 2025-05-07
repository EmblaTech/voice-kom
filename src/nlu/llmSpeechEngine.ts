import { SpeechEngineConfig } from "./model/speechEngineConfig";

export class LLMSpeechEngine implements SpeechEngine {
    private config: SpeechEngineConfig;
    constructor(config: SpeechEngineConfig) {
        this.config = config;
    }
    transcribe(rawAudio: Blob): Promise<string> {
        throw new Error("Method not implemented.");
    }
    detectIntent(transcription: string): Promise<IntentResult> {
        throw new Error("Method not implemented.");
    }
    extractEntities(transcription: string, intent: string): Promise<Record<string, any>> {
        throw new Error("Method not implemented.");
    }
}