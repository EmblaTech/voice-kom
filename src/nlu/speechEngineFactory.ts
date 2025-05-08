import { DefaultSpeechEngine } from "./defaultSpeechEngine";
import { LLMSpeechEngine } from "./llmSpeechEngine";

export class SpeechEngineFactory {
    static getEngine(type: string): SpeechEngine {
        let config = {
            type: type,
            transcribeModel: "default",
            intentModel: "default",
            entityRecognitionModel: "default",
            apiKey: process.env.API_KEY
        } 
      switch (type) {
        case "default":
          return new DefaultSpeechEngine(config);
        case "llm":
          return new LLMSpeechEngine(config);
        default:
          throw new Error(`Unsupported engine type: ${type}`);
      }
    }
  }