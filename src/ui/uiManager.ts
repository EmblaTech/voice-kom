import { Logger } from "../util/logger";
import { UIConfig } from "./model/uiConfig";

export class UIManager {
    private readonly logger = Logger.getInstance();
    private config: UIConfig;

    constructor(config: UIConfig) {
        this.config = config;
        this.logger.info("UIManager initialized with config", config);
    }

    showRecordingProgress(){
        //TODO:Disable button click
        this.toggleLoading(true);
    }

    resetRecordingProgress(message:string) {
        this.toggleLoading(false);
        this.showMessage(message);
        //TODO: set recording button state back to default
        //enable button click
    }
    showMessage(message:string) {
        this.logger.info(`UI::Message: ${message}`);
        // In a real implementation, this would update message in voice component
    }

    showError(message:string) {
        this.logger.error(`UI::Error: ${message}`);
        // Display error in UI
      }
      
    toggleLoading(show:boolean=true) {
        this.logger.info(`UI::Loading indicator`);
        // if true show else hide loading spinner
    }
}