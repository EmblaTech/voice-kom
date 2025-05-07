import { NLPModule } from "../nlu/nlpModule";
import { Logger } from "../util/logger";

export class CoreManager {
    private _lang:string
    private readonly logger = Logger.getInstance();
    private _nlpModule: NLPModule;
    
    async init(config: CoreConfig): Promise<void> {
        this._lang = config.lang;
        this._nlpModule = new NLPModule();
        this._nlpModule.init({});
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
        })
        .catch((error) => {
            this.logger.error("Core::There's an error while processing", error);
        })      
    }

    setLang(value: string) {
        this._lang = value;
        this.logger.info("Language set to:", value);
    }
}