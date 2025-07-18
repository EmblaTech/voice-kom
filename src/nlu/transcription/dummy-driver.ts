import { TranscriptionDriver } from './driver';

export class DummyTranscriptionDriver implements TranscriptionDriver {
  public transcribe(rawAudio: Blob): Promise<string> {
    console.warn("DummyTranscriptionDriver.transcribe was called unexpectedly. This should not happen in the Web Speech API flow.");
    return Promise.resolve("");
  }

  public init(lang: string, config: any): void {
    // No-op
  }

  public getAvailableLanguages(): string[] {
    // Return a sample, as this is just a placeholder
    return ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP'];
  }
}