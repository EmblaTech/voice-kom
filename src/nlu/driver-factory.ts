import { RecognitionConfig, TranscriptionConfig } from "../types";
import { CompromiseRecognitionDriver } from "./recognition/compromise-driver";
import { RecognitionDriver } from "./recognition/driver";
import { OpenAIRecognitionDriver } from "./recognition/openai-driver";
import { TranscriptionDriver } from "./transcription/driver";
import { GoogleTranscriptionDriver } from "./transcription/google-driver";
import { WhisperTranscriptionDriver } from "./transcription/whisper-driver";

export class DriverFactory {
    static getTranscriptionDriver(config: TranscriptionConfig): TranscriptionDriver {
      switch (config.provider) {
        case "default":
          return new WhisperTranscriptionDriver(config);
        case "google":
          return new GoogleTranscriptionDriver(config);
        default:
          throw new Error(`Unsupported engine type: ${config.provider}`);
      }
    }

    static getReconitionDriver(config: RecognitionConfig): RecognitionDriver {
      switch (config.provider) {
        case "default":
          return new CompromiseRecognitionDriver(config);
        case "openai":
          return new OpenAIRecognitionDriver(config);
        default:
          throw new Error(`Unsupported driver type: ${config.provider}`);
      }
    }
}