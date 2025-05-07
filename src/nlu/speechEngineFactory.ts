import { DefaultSpeechEngine } from "./defaultSpeechEngine";
import { LLMSpeechEngine } from "./llmSpeechEngine";
import { SpeechEngine } from "./speechEngine";

export class SpeechEngineFactory {
    static getEngine(type: string): SpeechEngine {
      switch (type) {
        case "default":
            let config = {
                // Add any default configuration here
            }
          return new DefaultSpeechEngine(config);
        case "llm":
            let llmconfig = {
                // Add any default configuration here
            }
          return new LLMSpeechEngine(llmconfig);
        default:
          throw new Error(`Unsupported engine type: ${type}`);
      }
    }
  }