import { EventBus, SpeechEvents } from '../common/eventbus';
import {WakewordDetector} from '../types';


export class WebspeechWakewordDetector implements WakewordDetector {
  private readonly recognition: SpeechRecognition;
  private isListening = false;
  private wakeWord: string = '';

  constructor(private readonly eventBus: EventBus) {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      throw new Error("Speech Recognition API is not supported in this browser.");
    }
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.setupListeners();
  }

  /**
   * Initializes the detector with the wake word.
   * @param wakeWord The word or phrase to listen for.
   */
  public init(wakeWord: string): void {
    if (!wakeWord) {
      throw new Error("A wake word must be provided for the WakeWordDetector.");
    }
    this.wakeWord = wakeWord.toLowerCase();
  }

  private setupListeners(): void {
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('').toLowerCase();
        
      if (transcript.includes(this.wakeWord)) {
        console.log(`WakeWordDetector: Detected "${this.wakeWord}"!`);
        // The detector's only job is to emit this event.
        // It does not stop itself; the CoreModule will do that.
        this.eventBus.emit(SpeechEvents.WAKE_WORD_DETECTED);
      }
    };

    this.recognition.onend = () => {
      // If listening was unexpectedly interrupted, and we are supposed to be active, restart.
      if (this.isListening) {
        console.warn("WakeWordDetector: Service ended unexpectedly, restarting...");
        this.recognition.start();
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
        console.error("WakeWordDetector Error:", event.error);
      }
    };
  }

  /**
   * Starts the wake word detection.
   */
  public start(): void {
    if (this.isListening || !this.wakeWord) {
      return;
    }
    try {
      this.isListening = true;
      this.recognition.start();
      console.log(`WakeWordDetector: Passively listening for "${this.wakeWord}"...`);
    } catch (e) {
      this.isListening = false;
      console.error("Could not start WakeWordDetector:", e);
    }
  }

  /**
   * Stops the wake word detection.
   */
  public stop(): void {
    if (!this.isListening) {
      return;
    }
    this.isListening = false;
    this.recognition.stop();
    console.log("WakeWordDetector: Stopped.");
  }
}