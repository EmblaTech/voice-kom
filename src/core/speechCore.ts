import { ActuationManager } from "../actuator/actuationManager";
import { ActuatorConfig } from "../actuator/model/actuatorConfig";
import { NLUConfig } from "../nlu/model/nluConfig";
import { NLPModule } from "../nlu/nlpModule";
import { UIConfig } from "../ui/model/uiConfig";
import { UIManager } from "../ui/uiManager";
import { Logger } from "../util/logger";
import { CoreConfig } from "./model/coreConfig";

export class SpeechCore {
    private _lang:string
    private readonly logger = Logger.getInstance();
    private _nlpModule: NLPModule;
    private _actuator: ActuationManager;
    private _uiManager: UIManager;

    async init(config: CoreConfig): Promise<void> {
        this._lang = config.lang;
        this._nlpModule = new NLPModule();
        this._nlpModule.init(this.toNLPModuleConfig(config));
        this._actuator = new ActuationManager(this.toActuatorConfig(config));
        this._uiManager = new UIManager(this.toUIConfig(config));
        this.logger.info("Core initialized with config", config);
    }

    async startRecording() {
        this.logger.info("Core recording started");
        this._uiManager.showRecordingProgress();
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
            this._uiManager.resetRecordingProgress(transcription);
        })
        .catch((error) => {
            this.logger.error("Core::There's an error while processing", error);
            //Update UI with error
            this._uiManager.showError(error.message);
        })      
    }

    private toNLPModuleConfig(config: CoreConfig): NLUConfig {
        return {
            lang: config.lang,
            engineConfig: config.engineConfig
        }
    }

    private toActuatorConfig(config: CoreConfig): ActuatorConfig {
        return {
            retryAttempts: config.retryAttempts,
            timeout: config.timeout 
        }
    }

    private toUIConfig(config: CoreConfig): UIConfig {
        return {
            position: config.uiConfig?.position,
               width: config.uiConfig?.width,
               height: config.uiConfig?.height,
               showProgress: config.uiConfig?.showProgress,
               showTranscription: config.uiConfig?.showTranscription,
               autoStart: config.uiConfig?.autoStart,
               styles: config.uiConfig?.styles,
               theme: config.uiConfig?.theme, 
        }
    }

    setLang(value: string) {
        this._lang = value;
        this.logger.info("Language set to:", value);
    }
}