import { IntentResult } from "./model/intentResult";
import { SpeechEngineConfig } from "./model/speechEngineConfig";

export abstract class SpeechEngine {
    protected config: SpeechEngineConfig;

    constructor(config: SpeechEngineConfig) {
        this.config = config;
    }
    abstract transcribe(audioInput: AudioInput): Promise<string>;
    abstract detectIntent(text: string): Promise<IntentResult>;
    abstract extractEntities(text: string, intent: string): Promise<Record<string, any>>;
}