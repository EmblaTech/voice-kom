interface CoreConfig {
    lang: string;
    engineConfig: EngineConfig;
    retryAttempts?:number,
    timeout?: number,
}