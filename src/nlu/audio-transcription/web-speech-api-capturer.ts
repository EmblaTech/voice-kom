import { AudioCapturer, VADConfig } from '../../types';
import { EventBus, SpeechEvents } from '../../common/eventbus';
import { Logger } from '../../utils/logger';

// Handle browser prefixing
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export class WebSpeechAPICapturer implements AudioCapturer {
  private readonly logger = Logger.getInstance();
  private recognition: SpeechRecognition;
  private isListening = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly lang: string = 'en-US'
  ) {
    if (!SpeechRecognition) {
      throw new Error('Web Speech API is not supported in this browser.');
    }
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }

  private setupRecognition(): void {
    this.recognition.lang = this.lang;
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.logger.info("Web Speech API has started listening.");
      this.eventBus.emit(SpeechEvents.RECORDING_STARTED);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      this.logger.info(`Web Speech API recognized: "${transcript}"`);
      // This is the short-circuit. We directly provide the final transcript.
      this.eventBus.emit(SpeechEvents.TRANSCRIPTION_COMPLETED, transcript);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.logger.error('Web Speech API Error:', event.error);
      this.eventBus.emit(SpeechEvents.ERROR_OCCURRED, event);
    };

    this.recognition.onend = () => {
      this.logger.info("Web Speech API has stopped.");
      this.isListening = false;
      this.eventBus.emit(SpeechEvents.RECORDING_STOPPED);
    };
  }

  /**
   * Implements the AudioCapturer interface.
   */
  public async listenForUtterance(config: VADConfig): Promise<void> {
    if (this.isListening) return;
    this.logger.info("Starting Web Speech API listening cycle.");
    this.isListening = true;
    try {
      // The VADConfig is ignored as Web Speech API has its own internal VAD.
      this.recognition.start();
    } catch (e) {
      this.logger.warn("Could not start Web Speech API.", e);
      this.isListening = false;
    }
  }

  /**
   * Implements the AudioCapturer interface.
   */
  public stopListening(): void {
    if (!this.isListening) return;
    this.logger.info("Forcibly stopping Web Speech API.");
    this.recognition.stop();
    this.isListening = false;
  }
}