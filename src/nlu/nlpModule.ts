import { Logger } from "../util/logger";
import { AudioRecorder } from "./audioRecorder";
import { IntentEntityResult } from "./model/intentEntityResult";
import { SpeechManager } from "./speechManager";

export class NLPModule {
    private speechManager: SpeechManager;
    private audioRecorder: AudioRecorder;
    private isRecording: boolean = false;
    private readonly logger = Logger.getInstance();

    async init(config: any): Promise<void> {
        this.audioRecorder = new AudioRecorder();
        this.speechManager = new SpeechManager();
        this.speechManager.init({});
        this.logger.info("NLPModule initialized with config", config);
    }

    public async startRecording(): Promise<void> {
        if (this.isRecording) return;

        this.logger.info("NLP recording started"); 
        this.audioRecorder.startRecording();     
        this.isRecording = true;
    }

    public async stopRecording(): Promise<IntentEntityResult> {
        if (!this.isRecording) {
          throw new Error('NLUModule: No active recording to stop');
        }

        this.logger.info("NLP recording stopped");
        return new Promise<IntentEntityResult>((resolve, reject) => {
            this.audioRecorder.stopRecording()
            .then((rawAudio) => {
                this.isRecording = false;
                this.speechManager.processAudio(rawAudio)
                .then((result) => {
                    this.logger.info("NLP::Successfully processed audio", result);
                    resolve(result);
                })
                .catch((error) => {
                    this.logger.info("NLP::Failed to process audio", error);
                    reject(new Error("Failed to process audio: " + error.message));
                })
                
            })
            .catch((error) => {
                this.isRecording = false;
                reject(new Error("Failed to stop recording: " + error.message));
            })
        });
    }
}