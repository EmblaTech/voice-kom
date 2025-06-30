import { AdapterConfig } from "../src/Adapter/model/adaperConfig";
import { NLPConfig, NLUEngineConfig, STTConfig } from "../src/nlp/model/nlpConfig";
import { CoreConfig } from "../src/core/model/coreonfig";
import { UIConfig } from "../src/uicomponent/model/uiConfig";
import { ProcessedEntities } from "../src/voiceactuator/voice-actuator";

/**
 * Defines symbols for dependency injection (e.g., with InversifyJS).
 */
export const TYPES = {
  CoreModule: Symbol.for('CoreModule'),
  NLPModule: Symbol.for('NLPModule'),
  UIComponent: Symbol.for('UIComponent'),
  AudioCapturer: Symbol.for('AudioCapturer'),
  STTDriver: Symbol.for('STTDriver'),
  EventBus: Symbol.for('EventBus'),
  StateStore: Symbol.for('StateStore'),
  CommandRegistry: Symbol.for('CommandRegistry'),
  VoiceActuator: Symbol.for('VoiceActuator'),
  NLUDriverFactory: Symbol.for('NLUDriverFactory'),
  // Specific NLU driver implementations
  CompromiseNLUDriver: Symbol.for('CompromiseNLUDriver'),
  LLMNLUDriver: Symbol.for('LLMNLUDriver'),
};

/**
 * Represents the current status of the voice recognition process.
 */
export enum RecordingStatus {
  IDLE = 'idle',
  WAITING = 'waiting', // Waiting for speech to begin
  RECORDING = 'recording',
  PROCESSING = 'processing', // STT and NLU are running
  EXECUTING = 'executing', // An action is being performed
  ERROR = 'error'
}

/**
 * Categorizes potential errors within the library.
 */
export enum ErrorType {
  MICROPHONE_ACCESS = 'microphone_access',
  TRANSCRIPTION = 'transcription',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

/**
 * Defines all possible command intents the system can recognize.
 */
export enum IntentTypes {
  CLICK_ELEMENT = 'click_element',
  SCROLL = 'scroll',
  SCROLL_TO_ELEMENT = 'scroll_to_element',
  FILL_INPUT = 'fill_input',
  SPEAK_TEXT = 'speak_text',
  CHECK_CHECKBOX = 'check_checkbox',
  UNCHECK_CHECKBOX = 'uncheck_checkbox',
  CHECK_ALL = 'check_all',
  UNCHECK_ALL = 'uncheck_all',
  SELECT_RADIO_OR_DROPDOWN = 'select_radio_or_dropdown',
  OPEN_DROPDOWN = 'open_dropdown',
  GO_BACK = 'go_back',
  FILL_FORM = 'fill_form',
  UNKNOWN = 'UNKNOWN',
}


//================================================================//
// CORE MULTILINGUAL ENTITY DEFINITIONS (METHOD 3 IMPLEMENTATION) //
//================================================================//

/**
 * A structured entity for any UI element.
 * This is the core of the multilingual strategy, capturing both the original
 * spoken term and its English-normalized version for robust matching.
 */
export interface VoiceEntity {
  english: string;
  user_language: string;
}

/**
 * A type guard to safely check if a given entity is a `VoiceEntity`.
 * This is extremely useful in action handlers to determine how to process an entity.
 * @example
 * if (isVoiceEntity(entities.target)) {
 *   // We can now safely access entities.target.user_language
 * }
 */
export const isVoiceEntity = (entity: any): entity is VoiceEntity => {
  return entity && typeof entity.user_language === 'string' && typeof entity.english === 'string';
};

/**
 * A union type representing all possible value types for an entity.
 * It can be a simple primitive or a complex `VoiceEntity`.
 */
export type EntityValue = string | VoiceEntity;

/**
 * A strongly-typed record for all entities extracted from an intent.
 * The key is the entity name (e.g., "target", "value"), and the value
 * can be any of the types defined in `EntityValue`.
 */
export type Entities = Record<string, EntityValue>;

/**
 * The structured result of an intent recognition process.
 * It now uses the strongly-typed `Entities` record.
 */
export interface IntentResult {
  intent: IntentTypes;
  confidence: number;
  entities?: Entities;
}


//================================================================//
// MODULE AND DRIVER INTERFACES                                   //
//================================================================//

// --- Input / Processing Drivers ---

export interface ISTTDriver {
  init(lang: string, config: STTConfig): void;
  transcribe(audioBlob: Blob): Promise<string>;
  getAvailableLanguages(): string[];
}

export interface INLUDriver {
  init(lang: string, config: NLUEngineConfig): void;
  identifyIntent(text: string): Promise<IntentResult[]>; // Always returns a promise of an array for consistency
  getAvailableIntents(): IntentTypes[];
}

export interface IAudioCapturer {
  startRecording(): void;
  stopRecording(): Promise<Blob>;
}

// --- Output / Actuator Interfaces ---

export interface IUIComponent {
  init(config: UIConfig): void;
  updateFromState(): void;
  setTranscription(transcription: string): void;
}

export interface Action {
  /**
   * Executes the defined action using the provided entities.
   * @param entities The entities extracted from the user's command.
   * @returns `true` if the action was successful, `false` otherwise.
   */
  execute(entities: ProcessedEntities): boolean | Promise<boolean>;
}

export interface IActionRegistry {
  registerAction(name: string, action: Action): void;
  mapIntentToAction(intent: string, actionName: string): void;
  getActions(intent: string): Action[];
  getRegisteredActionNames(): string[];
}

export interface IVoiceActuator {
  performAction(intents: IntentResult[]): Promise<boolean>;
}

// --- Core Module Interfaces ---

export interface INLPModule {
  init(config: NLPConfig): Promise<void>;
  startListening(): void;
  stopListening(): Promise<void>;
  getAvailableLanguages(): string[];
}

export interface ICoreModule {
  init(config: CoreConfig): Promise<void>;
  startListening(): void;
  stopListening(): void;
}

/**
 * The main interface for the entire voice library.
 */
export interface IVoiceLib {
  init(config: AdapterConfig): Promise<void>;
}


//================================================================//
// CONFIGURATION AND REGISTRY STRUCTURES                          //
//================================================================//

/**
 * Defines the structure for registering a new command intent.
 */
export interface CommandIntent {
  name: string;
  utterances: string[]; // Used by simpler NLU engines
  entities: string[];   // Defines expected entities for LLM-based engines
}

/**
 * Defines the overall structure for the command registry.
 */
export type CommandRegistry = {
  intents: CommandIntent[];
};