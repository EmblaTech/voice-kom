import { Logger } from "../util/logger";
import { IntentEntityResult } from "./model/intentEntityResult";
import { SpeechEngineConfig } from "./model/speechEngineConfig";
import { SpeechEngineFactory } from "./speechEngineFactory";

export class SpeechManager {
    private config: SpeechEngineConfig;
    private speechEngine: SpeechEngine;
    private readonly logger = Logger.getInstance();
    
    async init(config: SpeechEngineConfig) {
        this.config = config;
        this.speechEngine = SpeechEngineFactory.getEngine(config.type);
        this.logger.info("Speech manager initialized with config", config);
    }

    setEngine(type: string): void {
        this.speechEngine = SpeechEngineFactory.getEngine(type);
    }

    async processAudio(rawAudio: Blob): Promise<IntentEntityResult> {
        try {
            const transcription = await this.speechEngine.transcribe(rawAudio);
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