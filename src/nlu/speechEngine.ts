interface SpeechEngine {
    transcribe(rawAudio: Blob): Promise<string>;
    detectIntent(transcription: string): Promise<IntentResult>;
    extractEntities(transcription: string, intent: string): Promise<Record<string, any>>;
}