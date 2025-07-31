import { RecognitionProvider, TranscriptionProviders } from "../types";

export class Constant {
    public static readonly VALID_PROVIDERS = ['default', 'openai', 'google', 'azure', 'webspeech','whisper', 'voicekom'];
    public static readonly VALID_UI_POSITIONS = ['bottom-left', 'bottom-right'];
    public static readonly DEFAULT_WIDGET_ID = 'voice-kom-widget';
    public static readonly DEFAULT_LANG = 'en';
    public static readonly DEFAULT_TRANSCRIPTION_PROVIDER = TranscriptionProviders.DEFAULT;
    public static readonly DEFAULT_RECOGNITION_PROVIDER = RecognitionProvider.DEFAULT;
    public static readonly DEFAULT_WIDGET_POSITION = 'bottom-right';
    public static readonly DEFAULT_WIDGET_WIDTH = '300px';
    public static readonly DEFAULT_WIDGET_HEIGHT = '75px';
}
