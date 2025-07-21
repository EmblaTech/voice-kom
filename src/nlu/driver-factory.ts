import { RecognitionConfig, ReconitionProvider, TranscriptionConfig, TranscriptionProviders, AudioCapturer } from "../types";
import { CompromiseRecognitionDriver } from "./recognition/compromise-driver";
import { RecognitionDriver } from "./recognition/driver";
import { OpenAIRecognitionDriver } from "./recognition/openai-driver";
import { TranscriptionDriver } from "./transcription/driver";
import { GoogleTranscriptionDriver } from "./transcription/google-driver";
import { WhisperTranscriptionDriver } from "./transcription/whisper-driver";
import { WebAudioCapturer } from './audio-capturer'; 
import { WebSpeechAPICapturer } from './audio-transcription/web-speech-api-capturer'; 
import { DummyTranscriptionDriver } from './transcription/dummy-driver';

import { EventBus } from "../common/eventbus";

export class DriverFactory {
  
  static getTranscriptionDriver(config: TranscriptionConfig): TranscriptionDriver {
    const engine = config.provider.toLowerCase();
    switch (engine) {
      case TranscriptionProviders.DEFAULT:
      case TranscriptionProviders.WEBSPEECH:
        return new DummyTranscriptionDriver();
      case TranscriptionProviders.GOOGLE:
        return new GoogleTranscriptionDriver(config);
      case TranscriptionProviders.WHISPER:
        return new WhisperTranscriptionDriver(config);
      default:
        throw new Error(`Unsupported driver type: ${config.provider}`);
    }
  }

  static getRecognitionDriver(config: RecognitionConfig): RecognitionDriver {
    const engine = config.provider.toLowerCase();
    switch (engine) {
      case ReconitionProvider.LLM:
      case ReconitionProvider.GPT:
      case ReconitionProvider.OPENAI:
        return new OpenAIRecognitionDriver(config);
      case ReconitionProvider.COMPROMISE:
      case ReconitionProvider.DEFAULT:
        return new CompromiseRecognitionDriver(config);
      default:
        throw new Error(`Unsupported driver type: ${config.provider}`);
    }
  }

  static getAudioCapturer(config: TranscriptionConfig, eventBus: EventBus): AudioCapturer {
    const provider = config.provider.toLowerCase();

    if (provider === TranscriptionProviders.WEBSPEECH || provider === TranscriptionProviders.DEFAULT) {
      return new WebSpeechAPICapturer(eventBus, config.lang);
    }    
    return new WebAudioCapturer(eventBus);
    
  }
}