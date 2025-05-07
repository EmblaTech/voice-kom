interface SpeechEngine {
    transcribe(audioInput: AudioInput): Promise<string>;
    detectIntent(text: string): Promise<IntentResult>;
    extractEntities(text: string, intent: string): Promise<Record<string, any>>;
}