import { ActuationManager } from "../actuator/actuationManager";
import { NLPModule } from "../nlu/nlpModule";
import { Logger } from "../util/logger";

export class SpeechCore {
    private _lang:string
    private readonly logger = Logger.getInstance();
    private _nlpModule: NLPModule;
    private _actuator: ActuationManager;
    
    async init(config: CoreConfig): Promise<void> {
        this._lang = config.lang;
        this._nlpModule = new NLPModule();
        this._nlpModule.init({});
        this._actuator = new ActuationManager(
            {
                retryAttempts: config.retryAttempts?? 3,
                timeout: config.timeout?? 5000 
            });
        this.logger.info("Core initialized with config", config);
    }

    async startRecording() {
        this.logger.info("Core recording started");
        await this._nlpModule.startRecording();        
    }

    async stopRecording() {
        this.logger.info("Core recording stopped");
        await this._nlpModule.stopRecording()
        .then((result) => {
            this.logger.info("Core::Successfully processed audio", result);
            //Calls DOM manager to update action on UI
            let transcription = result.rawText;
            let intent = result.intent;
            let confidence = result.confidence;
            let entities = result.entities;
            //this._actuator.click("buttonId", "click"); //Example of actuator call
            //Update UI with progress, transcribed text, and intent
        })
        .catch((error) => {
            this.logger.error("Core::There's an error while processing", error);
            //Update UI with error
        })      
    }

    setLang(value: string) {
        this._lang = value;
        this.logger.info("Language set to:", value);
    }
}