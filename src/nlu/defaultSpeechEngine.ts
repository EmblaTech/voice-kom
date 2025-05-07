import { IntentResult } from "./model/intentResult";
import { SpeechEngineConfig } from "./model/speechEngineConfig";
import { SpeechEngine } from "./speechEngine";

export class DefaultSpeechEngine extends SpeechEngine {
    constructor(config: SpeechEngineConfig) {
        super(config);
    }
    transcribe(audioInput: AudioInput): Promise<string> {
        throw new Error("Method not implemented.");
    }
    detectIntent(text: string): Promise<IntentResult> {
        throw new Error("Method not implemented.");
    }
    extractEntities(text: string, intent: string): Promise<Record<string, any>> {
        throw new Error("Method not implemented.");
    }
}