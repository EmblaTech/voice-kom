import { IntentTypes } from "../../types";

interface CommandConfig {
    utterances: string[];
    entities: string[];
}
  
interface CommandRegistryMap {
    [key: string]: CommandConfig;
}

export class CommandRegistry {
    private static registry: CommandRegistryMap = {
        [IntentTypes.CLICK_ELEMENT]: {
            utterances: ["click (target)", "press (target)", "tap (target)"],
            entities: ["target"]
        },
        [IntentTypes.FILL_INPUT]: {
            utterances: ["Fill (target) as (value)", "Enter (target) as (value)","Enter (target) with (value)", "Fill (target) with (value)"],
            entities: ["target", "value"]
        },
        [IntentTypes.SCROLL_TO_ELEMENT]: {
            utterances: ["scroll to (target)", "go to (target) section"],
            entities: ["target"]
        }
    };

    static getRegistry(): CommandRegistryMap {
        return this.registry;
    }
}