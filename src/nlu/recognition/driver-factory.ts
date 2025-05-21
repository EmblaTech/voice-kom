import { CompromiseRecognitionDriver } from "./compromise-driver";
import { RecognitionDriver } from "./driver";
import { OpenAIRecognitionDriver } from "./openai-driver";

export class RecogniseDriverFactory {
    static getDriver(type: string, config: RecogniseDriverFactory): RecognitionDriver {
      switch (type) {
        case "default":
          return new CompromiseRecognitionDriver(config);
        case "openai":
          return new OpenAIRecognitionDriver(config);
        default:
          throw new Error(`Unsupported driver type: ${type}`);
      }
    }
}