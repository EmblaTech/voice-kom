// services/wake-word-service.ts

import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { PorcupineWorker } from '@picovoice/porcupine-web';

export class WakeWordService {
  private webVoiceProcessor: WebVoiceProcessor | null = null;
  private porcupineWorker: PorcupineWorker | null = null;

  constructor(
    private readonly accessKey: string,
    private readonly keywordPath: string,
    private readonly onWakeWord: () => void, // This callback is the critical link
    private readonly modelPath: string // Path to the Porcupine model
  ) {
    if (!accessKey || !keywordPath || !modelPath) {
      throw new Error("Picovoice AccessKey, keywordPath, and modelPath are required.");
    }
  }

  /**
   * Initializes and starts the wake word engine.
   */
  public async start(): Promise<void> {
    if (this.porcupineWorker) {
      console.log("WakeWordService already started.");
      return;
    }

    try {
      console.log("Initializing Porcupine worker...");
      this.porcupineWorker = await PorcupineWorker.create(
        this.accessKey,
        {
          publicPath: this.keywordPath, // Path to your .ppn file
          // You must also provide the path to the base model file
          customWritePath: 'porcupine_params.pv' 
        },
        (keyword) => {
          console.log(`Wake word detected: "${keyword.label}"`);
          // Stop listening immediately to prevent re-triggering
          this.stop(); 
          // Fire the callback to notify the main application
          this.onWakeWord();
        },
        {
          // Path to the base model file in your public assets
          publicPath: this.modelPath
        }
      );
      
      console.log("Starting WebVoiceProcessor...");
      // The WebVoiceProcessor handles getting the microphone and feeding the audio stream
      this.webVoiceProcessor = await WebVoiceProcessor.init({
        engines: [this.porcupineWorker],
        // You can specify which audio device to use, or leave it to the browser default
      });
      console.log("WakeWordService is now passively listening...");

    } catch (error) {
      console.error("Failed to start WakeWordService:", error);
      throw error;
    }
  }

  /**
   * Stops the wake word engine. You call this after a command is processed.
   */
  public stop(): void {
    if (this.webVoiceProcessor) {
      this.webVoiceProcessor.pause(); // Use pause to keep the audio stream alive but stop processing
      console.log("WakeWordService paused.");
    }
  }

  /**
   * Resumes listening after a command has been handled.
   */
  public resume(): void {
    if (this.webVoiceProcessor) {
      this.webVoiceProcessor.resume();
      console.log("WakeWordService resumed listening...");
    }
  }

  /**
   * Fully releases all resources.
   */
  public release(): void {
    if (this.webVoiceProcessor) {
      this.webVoiceProcessor.release();
      this.webVoiceProcessor = null;
    }
    if (this.porcupineWorker) {
      this.porcupineWorker.terminate();
      this.porcupineWorker = null;
    }
    console.log("WakeWordService released.");
  }
}