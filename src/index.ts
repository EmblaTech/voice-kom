import { VoiceActuator } from "./actuator/voice-actuator";
import { EventBus } from "./common/eventbus";
import { Status } from "./common/status";
import { CoreModule } from "./core/core-module";
import { NLUModule } from "./nlu/nlu-module";
import { VoiceKomConfig } from "./types";
import { UIHandler } from "./ui/ui-handler";
import { ConfigValidatorAndBuilder } from "./utils/config-validator-builder";
import { Logger } from "./utils/logger";
import { WebspeechWakewordDetector } from "./wakeword/WebspeechAPICapturer";

export class VoiceKom {
  private readonly logger = Logger.getInstance();
  private eventBus!: EventBus;
  private status!: Status;
  private voiceActuator!: VoiceActuator;
  private coreModule!: CoreModule; 
  private nluModule!: NLUModule; 
  private uiHandler!: UIHandler;
  private wakeWordDetector!: WebspeechWakewordDetector;

    constructor() {
        this.injectDependencies();
    }

    public async init(config: VoiceKomConfig): Promise<void> {
        // 1. Process, validate, and apply defaults all in one step.
        console.log(config)
        const { finalConfig, errors } = ConfigValidatorAndBuilder.validateAndGenerateConfig(config);
        console.log("finalConfig: ", finalConfig);
        console.log("errors: ", errors);

        // 2. Check if there were any validation errors.
        if (errors.length > 0) {
            const errorMsg = `Invalid configuration: ${errors.join(', ')}`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        // 3. The finalConfig is now guaranteed to be valid and complete.
        await this.coreModule.init(finalConfig);
    }

    private injectDependencies() {
        this.eventBus = new EventBus();
        this.status = new Status();

        this.wakeWordDetector = new WebspeechWakewordDetector(this.eventBus);
        this.voiceActuator = new VoiceActuator(this.eventBus);
        this.uiHandler = new UIHandler(this.eventBus, this.status);
        this.nluModule = new NLUModule(this.eventBus, this.status);
        this.coreModule = new CoreModule(this.nluModule, this.uiHandler, this.voiceActuator, this.eventBus, this.status, this.wakeWordDetector);
    }
}

// Create singleton instance
const voiceKom = new VoiceKom();

// Make sure it's properly exposed for both module systems and global context
if (typeof window !== 'undefined') {
    (window as any).VoiceKom = voiceKom;
}

// Export as both default and named export for better compatibility
export { voiceKom };
export default voiceKom;