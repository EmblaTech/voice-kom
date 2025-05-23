// nlu-driver-factory.ts
import { injectable, inject } from 'inversify';
import { INLUDriver, TYPES } from '../types';
import { CompromiseNLUDriver } from './nlu-driver';
import { LLMNLUDriver } from './llm-nlu-driver';
import { NLUEngineConfig } from './model/nlpConfig';

/**
 * Factory for creating NLU drivers based on configuration
 */
@injectable()
export class NLUDriverFactory {
  constructor(
    @inject(CompromiseNLUDriver) private compromiseDriver: INLUDriver,
    @inject(LLMNLUDriver) private llmDriver: INLUDriver
  ) {}
  
  /**
   * Create the appropriate NLU driver based on configuration
   * @param lang Language code
   * @param config NLU configuration
   * @returns The configured NLU driver
   */
  createDriver(lang: string, config: NLUEngineConfig): INLUDriver {
    const nluEngine = config.nluEngine.toLowerCase();
    
    switch (nluEngine) {
      case 'llm':
      case 'gpt':
      case 'openai':
        this.llmDriver.init(lang, config);
        return this.llmDriver;
        
      case 'compromise':
      case 'default':
      default:
        this.compromiseDriver.init(lang, config);
        return this.compromiseDriver;
    }
  }
}