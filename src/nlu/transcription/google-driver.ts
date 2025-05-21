import { Logger } from "../../utils/logger";
import { TranscriptionDriver } from "./driver";
import { TranscriptionConfig } from "../../types";

export class GoogleTranscriptionDriver implements TranscriptionDriver {
    private readonly logger = Logger.getInstance();
    private readonly config: TranscriptionConfig;
    constructor(config: TranscriptionConfig) { 
        this.config = config
    }
    
    transcribe(rawAudio: Blob): Promise<string> {
        throw new Error("Method not implemented.");
    }
}