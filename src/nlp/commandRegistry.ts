import { IntentTypes } from '../types';

// Interface for command configuration
export interface CommandConfig {
  utterances: string[];
  entities: string[];
}

// Interface for the command registry
export interface ICommandRegistry {
  [key: string]: CommandConfig;
}

// Implementation of the command registry
export class CommandRegistry implements ICommandRegistry {
  [key: string]: CommandConfig;

  constructor() {
    // Initialize with default commands
    this[IntentTypes.CLICK_ELEMENT] = {
      utterances: ["click (target)", "press (target)", "tap (target)"],
      entities: ["target"]
    };
    
    this[IntentTypes.FILL_INPUT] = {
      utterances: ["Fill (target) as (value)", "Enter (target) as (value)", "Enter (target) with (value)", "Fill (target) with (value)"],
      entities: ["target", "value"]
    };
    
    this[IntentTypes.SCROLL] = {
      utterances: ["scroll (direction)","scroll to (direction)", "go (direction)"],
      entities: ["direction"]
    };
    
    this[IntentTypes.SCROLL_TO_ELEMENT] = {
      utterances: ["scroll to (target)", "go to (target)"],
      entities: ["target"]
    };

    this[IntentTypes.CHECK_CHECKBOX] = {
      utterances: [
        "check (target)", 
        "select (target) checkbox",  
        "tick (target)", 
        "enable (target) option"
      ],
      entities: ["target"]
    };

    this[IntentTypes.UNCHECK_CHECKBOX] = {
      utterances: [
        "uncheck (target)", 
        "deselect (target) checkbox", 
        "untick (target)", 
        "disable (target) option"
      ],
      entities: ["target"]
    };

     this[IntentTypes.CHECK_ALL] = {
      utterances: [
        "check all (targetGroup)", 
        "select all (targetGroup)"
      ],
      entities: ["targetGroup"]
    };

    this[IntentTypes.UNCHECK_ALL] = {
      utterances: [
        "uncheck all (targetGroup)", 
        "deselect all (targetGroup)"
      ],
      entities: ["targetGroup"]
    };
    
    this[IntentTypes.SELECT_RADIO_OR_DROPDOWN] = {
      utterances: [
        "select (target) in (group)", 
        "choose (target) in (group)", 
        "pick (target) in (group)",
        "select (target)",
        "choose (target)",
        "pick (target)"
      ],
      entities: ["target", "group"]
    };

    this[IntentTypes.OPEN_DROPDOWN] = {
      utterances: [
        "Open (target)", 
        "Drop down (target)", 
        "Open (target) drop down",
      ],
      entities: ["target"]
    };

    this[IntentTypes.GO_BACK] = {
      utterances: [
        "Go Back", 
      ],
      entities: []
    };
  }
 
}