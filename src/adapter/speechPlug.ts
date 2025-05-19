import { Logger } from '../utils/logger';
import { CoreModule } from '../core/core-module';
import { SpeechPlugConfig } from './model/plugConfig';
import { Validator } from '../utils/validator';

export class SpeechPlug {
  //private coreModule: CoreModule;

  private readonly logger = Logger.getInstance();
  private readonly VALID_PROVIDERS = ['default', 'openai', 'google', 'azure'];
  private readonly VALID_UI_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  constructor() {
    //this.coreModule = new CoreModule();
  }
  
  public async init(config: SpeechPlugConfig): Promise<void> {
    const validation = this.validateSpeechPlugConfig(config);
    if (!validation.isValid) {
      this.logger.info(`Invalid configuration: ${validation.errors.join(', ')}`);

      //throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    /*
    await this.coreModule!.init({
      nlp: {
        lang: config.lang,
        sst: {
          sttEngine: config.transcription?.provider ?? '',
          sttApiKey: config.transcription?.apiKey ?? ''
          //speechEngineParams: config.transcription?.options,
        } 
      },
      ui: {
        containerId: config.containerId,
        autoStart: config.ui?.autoStart,
        position: config.ui?.position,
        width: config.ui?.width,
        height: config.ui?.height,
        theme: config.ui?.theme,
        showProgress: config.ui?.showProgress,
        showTranscription: config.ui?.showTranscription,
        styles: config.ui?.styles
      },
      retryAttempts: config.retries,
      timeout: config.timeout
    });
    */
  }

  // Function to validate the configuration
 private validateSpeechPlugConfig(config: SpeechPlugConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Validator.isString(config.containerId)) {
      errors.push('containerId must be a string');
    }  

    if (!Validator.isString(config.lang)) {
      errors.push('language must be a string');
    }

    if (!Validator.isNum(config.retries)) {
      errors.push("retries must be a number");
    }

    if (!Validator.isNum(config.timeout)) {
        errors.push("timeout must be a number");
    }

    this.validateProviderConfig(config.transcriptionProvider, "transcriptionProvider", errors);
    this.validateProviderConfig(config.recognitionProvider, "recognitionProvider", errors);
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
    if (config && config.ui) {
        if (!Validator.isBoolean(config.ui.autoStart)) errors.push("ui.autoStart must be a boolean");          
        if (!Validator.isString(config.ui.width)) errors.push("ui.width must be number or string");
        if (!Validator.isString(config.ui.height)) errors.push("ui.height must be number or string");
        if (!Validator.isString(config.ui.theme)) errors.push("ui.theme must be a string");
        if (!Validator.isBoolean(config.ui.showProgress)) errors.push("ui.showProgress must be a boolean");
        if (!Validator.isBoolean(config.ui.showTranscription)) errors.push("ui.showTranscription must be a boolean");
        
        const positionResult = Validator.isInValues(config.ui.position, this.VALID_UI_POSITIONS, 'Container position');
        if (!positionResult.valid && positionResult.message) {
            errors.push(positionResult.message);
        }
        if (!Validator.isObject(config.ui.styles)) errors.push("ui.styles must be an object");
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