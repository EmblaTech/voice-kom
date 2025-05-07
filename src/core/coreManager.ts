import Logger from "../util/logger";

class CoreManager {
    private _lang:string
    private readonly logger = Logger.getInstance();

    constructor(options: CoreOptions) {
        this._lang = options.lang;
        this.logger.info("Core started with options:", options);
    }

    async init(): Promise<void> {
        this.logger.info("Core initialized");
    }

    start() {
        this.logger.info("Core started");
    }

    stop() {
        this.logger.info("Core stopped");
    }

    setLang(value: string) {
        this._lang = value;
        this.logger.info("Language set to:", value);
    }
}
export default CoreManager;