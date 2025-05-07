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
        this.logger.info("NLPModule initialized with config", config);
    }

    public async startRecording(): Promise<void> {
        if (this.isRecording) return;

        this.logger.info("NLP recording started"); 
        await this.audioRecorder.startRecording();     
        this.isRecording = true;
    }

    public async stopRecording(): Promise<IntentEntityResult> {
        if (!this.isRecording) {
          throw new Error('NLUModule: No active recording to stop');
        }

        this.logger.info("NLP recording stopped");
        await this.audioRecorder.stopRecording();        
        this.isRecording = false;
        return Promise.resolve({
            intent: '',
            confidence: 0,
            entities: {},
            rawText: '',
            alternatives: []
        })
    }
}