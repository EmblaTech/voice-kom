import { TranscriptionConfig } from "../../types";
import { TranscriptionDriver } from './driver';

export class DummyTranscriptionDriver implements TranscriptionDriver {
  
  private readonly AVAILABLE_LANGUAGES: string[] = 
    ['af','ar','hy','az','be','bs','bg','ca',
        'zh','hr','cs','da','nl','en','et','fi',
        'fr','gl','de','el','he','hi','hu','is',
        'id','it','ja','kn','kk','ko','lv','lt',
        'mk','ms','mi','mr','ne','no','fa','pl',
        'pt','ro','ru','sr','sk','sl','es','sw',
    'sv','tl','ta','th','tr','uk','ur','vi','cy'];
  
  
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