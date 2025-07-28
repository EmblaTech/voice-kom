import { RecognitionConfig, RecognitionProvider, TranscriptionConfig, TranscriptionProviders, AudioCapturer } from "../types";
import { CompromiseRecognitionDriver } from "./recognition/compromise-driver";
import { RecognitionDriver } from "./recognition/driver";
import { OpenAIRecognitionDriver } from "./recognition/openai-driver";
import { TranscriptionDriver } from "./transcription/driver";
import { GoogleTranscriptionDriver } from "./transcription/google-driver";
import { WhisperTranscriptionDriver } from "./transcription/whisper-driver";
import { WebAudioCapturer } from './audio-capturer'; 
import { WebSpeechAPICapturer } from './audio-transcription/web-speech-api-capturer'; 
import { WebSpeechTranscriptionDriver } from './transcription/webspeech-driver';
import { VoiceKomTranscriptionDriver } from "./transcription/voicekom-transcription-driver";
import { VoiceKomRecognitionDriver } from "./recognition/voicekom-recognition-driver";

import { EventBus } from "../common/eventbus";
import { VoiceKomCompoundDriver } from "./compound/voicekom-compound-driver";

export class DriverFactory {
  // Add private static properties for singleton instances
  private static webSpeechCapturer: WebSpeechAPICapturer | null = null;
  private static webAudioCapturer: WebAudioCapturer | null = null;

  static getCompoundDriver(transConfig: TranscriptionConfig, recogConfig: RecognitionConfig): VoiceKomCompoundDriver | null{
    const isCompound = 
      transConfig.provider === TranscriptionProviders.VOICEKOM &&
      recogConfig.provider === RecognitionProvider.VOICEKOM;
      if (isCompound) {
        return new VoiceKomCompoundDriver(transConfig, recogConfig);
      }  
      return null;
  }
  
  static getTranscriptionDriver(config: TranscriptionConfig): TranscriptionDriver {
    const engine = config.provider.toLowerCase();
    switch (engine) {
      case TranscriptionProviders.DEFAULT:
      case TranscriptionProviders.WEBSPEECH:
        return new WebSpeechTranscriptionDriver();
      case TranscriptionProviders.GOOGLE:
        return new GoogleTranscriptionDriver(config);
      case TranscriptionProviders.WHISPER:
        return new WhisperTranscriptionDriver(config);
      case TranscriptionProviders.VOICEKOM:
        return new VoiceKomTranscriptionDriver(config);
      default:
        throw new Error(`Unsupported driver type: ${config.provider}`);
    }
  }

  static getRecognitionDriver(config: RecognitionConfig): RecognitionDriver {
    const engine = config.provider.toLowerCase();
    console.log(`Initializing recognition driver: ${engine}`);
    switch (engine) {
      case RecognitionProvider.COMPROMISE:
      case RecognitionProvider.DEFAULT:
        return new CompromiseRecognitionDriver(config);
      case RecognitionProvider.OPENAI:
        return new OpenAIRecognitionDriver(config);
      case TranscriptionProviders.VOICEKOM:
        return new VoiceKomRecognitionDriver(config);
      default:
        throw new Error(`Unsupported driver type: ${config.provider}`);
    }
  }

  static getAudioCapturer(config: TranscriptionConfig, eventBus: EventBus): AudioCapturer {
    const provider = config.provider.toLowerCase();
    
    // Use WebSpeechAPICapturer for webspeech and default providers
    if (provider === TranscriptionProviders.WEBSPEECH || 
        provider === TranscriptionProviders.DEFAULT) {
      
      // Create instance only if it doesn't exist
      if (!this.webSpeechCapturer) {
        this.webSpeechCapturer = new WebSpeechAPICapturer(eventBus, config.lang);
      }
      return this.webSpeechCapturer;
    }
    
    // Fallback to WebAudioCapturer for all other providers
    if (!this.webAudioCapturer) {
      this.webAudioCapturer = new WebAudioCapturer(eventBus);
    }
    return this.webAudioCapturer;
  }

  // Add cleanup method for testing/cleanup purposes
  static resetCapturers(): void {
    this.webSpeechCapturer = null;
    this.webAudioCapturer = null;
  }
}