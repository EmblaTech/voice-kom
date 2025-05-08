import { Logger } from "../util/logger";

export class UIManager {
    private readonly logger = Logger.getInstance();
    
    showMessage(message:string) {
        this.logger.info(`UI::Message: ${message}`);
        // In a real implementation, this would update message in voice component
    }

    showError(message:string) {
        this.logger.error(`UI::Error: ${message}`);
        // Display error in UI
      }
      
    showLoading() {
        this.logger.info(`UI::Loading indicator`);
        // Show/hide loading spinner
    }
}