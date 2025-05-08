import { UIConfig } from "../../ui/model/uiConfig";

export interface CoreConfig {
    lang: string;
    engineConfig: EngineConfig;
    uiConfig?: UIConfig;
    retryAttempts?:number,
    timeout?: number,
}