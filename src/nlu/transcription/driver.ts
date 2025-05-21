
export interface TranscriptionDriver {
    transcribe(rawAudio: Blob): Promise<string>;
}