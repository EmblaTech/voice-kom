import { RecognitionConfig } from "../../types";
import { Logger } from "../../utils/logger";
import { RecognitionDriver } from "./driver";

export class OpenAIRecognitionDriver implements RecognitionDriver {
    private readonly logger = Logger.getInstance();

    constructor(config: RecognitionConfig) {
        this.logger.info(`OpenAI RecognitionDriver initialized with config: ${JSON.stringify(config)}`);
    }

    detectIntent(text: string): any {
        this.logger.info(`Detecting intent for text: ${text}`);
        return { intent: "example_intent", confidence: 0.9 };
    }

    getAvailableIntents(): string[] {
        // Return a list of available intents
        return ["example_intent"];
    }
}