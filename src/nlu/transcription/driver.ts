export interface TranscriptionDriver {
    transcribe(rawAudio: Blob): Promise<string>;  
    init?(lang: string, config: any): void;   
    getAvailableLanguages(): string[];  // need to check
}