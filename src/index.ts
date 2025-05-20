import { EventBus } from "./common/eventbus";
import { Status } from "./common/status";
import { CoreModule } from "./core/core-module";
import { SpeechPlugConfig } from "./types";
import { UIHandler } from "./ui/ui-handler";
import { Logger } from "./utils/logger";
import { Validator } from "./utils/validator";

export class SpeechPlug {
  private readonly logger = Logger.getInstance();
  private readonly VALID_PROVIDERS = ['default', 'openai', 'google', 'azure'];
  private readonly VALID_UI_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  private eventBus!: EventBus;
  private status!: Status;
  private coreModule!: CoreModule; 
  private uiHandler!: UIHandler;
  constructor() {
    this.injectDependencies();
  }
  
  public async init(config: SpeechPlugConfig): Promise<void> {
    const validation = this.validateSpeechPlugConfig(config);
    if (!validation.isValid) {
      this.logger.error(`Invalid configuration: ${validation.errors.join(', ')}`);

      //throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    await this.coreModule.init({
      uiConfig: {
        containerId: config.containerId,
        autoStart: config.autoStart,
        position: config.position,
        width: config.width,
        height: config.height,
        theme: config.theme,
        showProgress: config.showProgress,
        showTranscription: config.showTranscription,
        styles: config.styles
      },
      actuatorConfig: { 
        retries: config.retries,
        timeout: config.timeout
      }
    });
  }

  private injectDependencies() {
    this.eventBus = new EventBus();
    this.status = new Status();
    this.uiHandler = new UIHandler(this.eventBus, this.status);
    this.coreModule = new CoreModule(this.uiHandler, this.eventBus, this.status);
  }
  // Function to validate the configuration
 private validateSpeechPlugConfig(config: SpeechPlugConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Validator.isString(config.containerId)) {
      errors.push('ContainerId must be a string');
    }  

    if (!Validator.isString(config.lang)) {
      errors.push('Language must be a string');
    }

    if (!Validator.isNum(config.retries)) {
      errors.push("Retries must be a number");
    }

    if (!Validator.isNum(config.timeout)) {
        errors.push("Timeout must be a number");
    }

    this.validateProviderConfig(config.transcriptionProvider, "TranscriptionProvider", errors);
    this.validateProviderConfig(config.recognitionProvider, "RecognitionProvider", errors);
    this.validateUIConfig(config, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateProviderConfig(providerConfig: any, type: string, errors: string[]) {
    if (!providerConfig) return;
    
    const providerResult = Validator.isInValues(providerConfig.name, this.VALID_PROVIDERS, 'Speech Provider');
    if (!providerResult.valid && providerResult.message) {
        errors.push(providerResult.message);
    }
    if (!Validator.isString(providerConfig.apiUrl)) errors.push(`${type}.apiUrl must be a string`);
    if (!Validator.isString(providerConfig.apiKey)) errors.push(`${type}.apiKey must be a string`);
    if (!Validator.isString(providerConfig.model)) errors.push(`${type}.model must be a string`);

    const confidenceResult = Validator.isInRange(providerConfig.confidence, 0, 1, 'Provider confidence')
    if (!confidenceResult.valid && confidenceResult.message) {
        errors.push(confidenceResult.message);
    }
  }

  private validateUIConfig(config: SpeechPlugConfig, errors:string[]){
      if (!Validator.isBoolean(config.autoStart)) errors.push("AutoStart must be a boolean");          
      if (!Validator.isString(config.width)) errors.push("Container width must be number or string");
      if (!Validator.isString(config.height)) errors.push("Container height must be number or string");
      if (!Validator.isString(config.theme)) errors.push("Container theme must be a string");
      if (!Validator.isBoolean(config.showProgress)) errors.push("ShowProgress must be a boolean");
      if (!Validator.isBoolean(config.showTranscription)) errors.push("ShowTranscription must be a boolean");
      if (!Validator.isObject(config.styles)) errors.push("Container styles must be an object");

      const positionResult = Validator.isInValues(config.position, this.VALID_UI_POSITIONS, 'Container position');
      if (!positionResult.valid && positionResult.message) {
          errors.push(positionResult.message);
      }      
  }
}

// Create singleton instance
const speechPlug = new SpeechPlug();

// Make sure it's properly exposed for both module systems and global context
if (typeof window !== 'undefined') {
  (window as any).SpeechPlug = speechPlug;
}

// Export as both default and named export for better compatibility
export { speechPlug };
export default speechPlug;