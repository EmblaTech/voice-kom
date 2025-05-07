import { IntentEntityResult } from "./model/intentEntityResult";
import { SpeechEngineConfig } from "./model/speechEngineConfig";
import { SpeechEngine } from "./speechEngine";
import { SpeechEngineFactory } from "./speechEngineFactory";

export class SpeechManager {
    private config: SpeechEngineConfig;
    private speechEngine: SpeechEngine;

    constructor(config: SpeechEngineConfig) {
        this.config = config;
        //this.setEngine(config.engineType);
    }

    setEngine(type: string): void {
        this.speechEngine = SpeechEngineFactory.getEngine(type);
    }

    async processAudio(audioInput: AudioInput): Promise<IntentEntityResult> {
        try {
            const transcription = await this.speechEngine.transcribe(audioInput);
            const intentResult = await this.speechEngine.detectIntent(transcription);
            const entities = await this.speechEngine.extractEntities(transcription, intentResult.intent);

            return {
                intent: intentResult.intent,
                confidence: intentResult.confidence,
                entities: entities,
                rawText: transcription,
                alternatives: intentResult.alternatives
            };
        } catch (error) {
            throw new Error(`Error processing audio: ${error}`);
        }
    }
}