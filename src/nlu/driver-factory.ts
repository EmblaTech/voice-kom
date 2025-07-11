import { RecognitionConfig, ReconitionProvider, TranscriptionConfig, TranscriptionProviders } from "../types";
import { CompromiseRecognitionDriver } from "./recognition/compromise-driver";
import { RecognitionDriver } from "./recognition/driver";
import { OpenAIRecognitionDriver } from "./recognition/openai-driver";
import { TranscriptionDriver } from "./transcription/driver";
import { GoogleTranscriptionDriver } from "./transcription/google-driver";
import { WhisperTranscriptionDriver } from "./transcription/whisper-driver";

export class DriverFactory {
  static getTranscriptionDriver(config: TranscriptionConfig, clientId: any, serverUrl: any): TranscriptionDriver {
    const engine = config.provider.toLowerCase();
    switch (engine) {
      case TranscriptionProviders.DEFAULT:
        return new WhisperTranscriptionDriver(config, clientId, serverUrl);
      case TranscriptionProviders.GOOGLE:
        return new GoogleTranscriptionDriver(config);
      default:
        throw new Error(`Unsupported driver type: ${config.provider}`);
    }
  }

  static getRecognitionDriver(config: RecognitionConfig, clientId: any, serverUrl: any): RecognitionDriver {
    const engine = config.provider.toLowerCase();
    switch (engine) {
      case ReconitionProvider.LLM:
      case ReconitionProvider.GPT:
      case ReconitionProvider.OPENAI:
        return new OpenAIRecognitionDriver(config, clientId, serverUrl);
      case ReconitionProvider.COMPROMISE:
      case ReconitionProvider.DEFAULT:
        return new CompromiseRecognitionDriver(config);
      default:
        throw new Error(`Unsupported driver type: ${config.provider}`);
    }
  }
}