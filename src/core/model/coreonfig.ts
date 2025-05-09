import { UIConfig } from "../../uicomponent/model/uiConfig";
import { NLPConfig, NLUEngineConfig } from "../../nlp/model/nlpConfig";

export interface CoreConfig {
    nlp?:NLPConfig;
    ui: UIConfig
    retryAttempts?:number,
    timeout?: number,
}