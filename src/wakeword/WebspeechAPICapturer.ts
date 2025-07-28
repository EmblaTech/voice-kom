import { EventBus, SpeechEvents } from '../common/eventbus';
import { WakewordDetector } from '../types';

export class WebspeechWakewordDetector implements WakewordDetector {
  private readonly recognition: SpeechRecognition;
  private isListening = false;
  private wakeWords: string[] = ['hey'];
  // Use an array to support multiple stop phrases for better UX
  private sleepWords: string[] = ['stop listening'];

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
   * Initializes the detector with the wake word and optional stop words.
   * @param wakeWord The word or phrase to listen for.
   * @param stopWords A single stop word or an array of stop words.
   */
  public init(wakeWords: string[], sleepWords?: string[]): void {
    console.log(`Initializing WakeWordDetector with wake words: ${wakeWords.join(', ')}`);
    console.log(`Sleep words are ffffff: ${sleepWords ? sleepWords.join(', ') : 'none'}`);
    if (!wakeWords || wakeWords.length === 0) {
      throw new Error("A wake word must be provided for the WakeWordDetector.");
    }
    this.wakeWords = wakeWords.map(word => word.toLowerCase());
    console.log(`Sleep words are: ${this.sleepWords.join(', ')}`);
    // Allow customizing the stop word(s)
    if (sleepWords) {
      this.sleepWords = sleepWords.map(sw => sw.toLowerCase());
    }
  }

  /**
   * Checks if a given transcription is a direct match for any of the configured stop words.
   * If a match is found, it emits the STOP_WORD_DETECTED event.
   * @param transcription The text transcribed from the user's command.
   */
  public checkForStopWord(transcription: string): void {
    const normalizedTranscription = this.normalizeText(transcription);
    console.log(`Sleep words are: ${this.sleepWords.join(', ')}`);
    // Check if the normalized text is an exact match for any of the stop words
    if (this.sleepWords.some(stopWord => normalizedTranscription === stopWord)) {
      console.log(`WakeWordDetector: Detected exact stop phrase! Emitting event.`);
      this.eventBus.emit(SpeechEvents.STOP_WORD_DETECTED);
    }
  }
  
  /**
   * Cleans text by converting to lowercase, removing common punctuation, and trimming whitespace.
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,!?;]/g, '') // Remove common punctuation marks
      .trim();
  }

   private setupListeners(): void {
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const originalTranscription = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');

      if (!originalTranscription.trim()) {
        return;
      }
      
      // We will now use a regular expression to find a whole word match.
      const detectedWakeWord = this.wakeWords.find(wakeWord => {
        // Create a regular expression to match the wake word as a whole word.
        // \b is a word boundary.
        // The 'i' flag makes the search case-insensitive.
        const wakeWordRegex = new RegExp(`\\b${wakeWord}\\b`, 'i');
        
        // Test the regex against the transcription.
        return wakeWordRegex.test(originalTranscription);
      });

      if (detectedWakeWord) {
        // The log message is now much more reliable!
        console.log(`WakeWordDetector: Detected wake word "${detectedWakeWord}" in transcription: "${originalTranscription}"`);
        this.eventBus.emit(SpeechEvents.WAKE_WORD_DETECTED, detectedWakeWord);
      }
    };

    this.recognition.onend = () => {
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
    if (this.isListening || !this.wakeWords || this.wakeWords.length === 0) {
      return;
    }
    try {
      this.isListening = true;
      this.recognition.start();
      console.log(`WakeWordDetector: Passively listening for "${this.wakeWords.join(", ")}"...`);
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