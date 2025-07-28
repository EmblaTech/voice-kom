import { TranscriptionConfig } from "../../types";
import { TranscriptionDriver } from './driver';

export class WebSpeechTranscriptionDriver implements TranscriptionDriver {
  
  private readonly AVAILABLE_LANGUAGES: string[] = 
  [
  'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'cs', 
  'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 
  'fil', 'fr', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 
  'is', 'it', 'ja', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'lo', 
  'lt', 'lv', 'mi', 'mk', 'ml', 'mr', 'ms', 'nb', 'ne', 'nl', 
  'no', 'pl', 'pt', 'ro', 'ru', 'si', 'sk', 'sl', 'sq', 'sr', 
  'su', 'sv', 'sw', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'vi', 
  'zh', 'zu', 'nb', 'nn'
];

  
    constructor(private readonly config: TranscriptionConfig) {
      this.validateConfig(config);
  }
  
  public transcribe(rawAudio: Blob): Promise<string> {
    console.warn("DummyTranscriptionDriver.transcribe was called unexpectedly. This should not happen in the Web Speech API flow.");
    return Promise.resolve("");
  }

  public init(lang: string, config: any): void {
    // No-op
  }

  private validateConfig(config: TranscriptionConfig): void {
    if (config.lang && !this.AVAILABLE_LANGUAGES.includes(config.lang.split(/[-_]/)[0].toLowerCase())) {
          throw new Error(`Unsupported language provided in configuration: ${config.lang}`);
      }
  }

  getAvailableLanguages(): string[] {
        return [...this.AVAILABLE_LANGUAGES];
    }
}