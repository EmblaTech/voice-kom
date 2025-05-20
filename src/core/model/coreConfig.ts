import { UIConfig } from "../../ui/model/uiConfig";
import { NLPConfig } from "../../nlp/model/nlpConfig";

export interface CoreConfig {
    nlp?:NLPConfig;
    ui: UIConfig
    retryAttempts?:number,
    timeout?: number,
}