import { Logger } from "../util/logger";
import { ActuatorConfig } from "./model/actuatorConfig";

export class ActuationManager {
    private _config: ActuatorConfig;    
    private readonly logger = Logger.getInstance();

    constructor(config: ActuatorConfig) {
        this.config = config;
    }

    findElement(selector: string): HTMLElement | null {
        const element = document.querySelector<HTMLElement>(selector);        
        if (!element) {
          this.logger.warn(`Element not found: ${selector}`);
          return null;
        }        
        return element;
    }

    findElements(selector: string): HTMLElement[] {
        const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));        
        if (elements.length === 0) {
          this.logger.warn(`No elements found for selector: ${selector}`);
        }        
        return elements;
    }

    click(selector: string ): boolean {
        const element = this.findElement(selector);        
        if (!element) {
          return false;
        }        
        try {
          element.click();          
          this.logger.debug(`Clicked element: ${selector}`);
          return true;
        } catch (error) {
          this.logger.error(`Error clicking element ${selector}:`, error);
          return false;
        }
    }

    fill(selector: string, value: string): boolean {
        const element = this.findElement(selector);        
        if (!element || !(element instanceof HTMLInputElement) || !(element instanceof HTMLTextAreaElement)) {
          return false;
        }        
        try {
          element.focus(); 
          element.value = value;
          // Trigger change events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          this.logger.debug(`Filled element ${selector} with value: ${value}`);
          return true;
        } catch (error) {
          this.logger.error(`Error filling element ${selector}:`, error);
          return false;
        }
    }

    selectOption(selector: string, value: string): boolean {
        const element = this.findElement(selector);        
        if (!element || !(element instanceof HTMLSelectElement)) {
          this.logger.warn(`Element ${selector} is not a select element`);
          return false;
        }        
        try {
          element.focus();
          element.value = value;          
          // Trigger change event
          element.dispatchEvent(new Event('change', { bubbles: true }));          
          this.logger.debug(`Selected option ${value} in ${selector}`);
          return true;
        } catch (error) {
          this.logger.error(`Error selecting option ${value} in ${selector}:`, error);
          return false;
        }
    }

    setCheckbox(selector: string, check: boolean): boolean {
        const element = this.findElement(selector);        
        if (!element || !(element instanceof HTMLInputElement) || element.type !== 'checkbox') {
          this.logger.warn(`Element ${selector} is not a checkbox`);
          return false;
        }        
        try {
          // Only take action if the current state differs from desired state
          if (element.checked !== check) {
            element.focus();            
            element.checked = check;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            this.logger.debug(`Set checkbox ${selector} to ${check}`);
            return true;
          }
          return false
        } catch (error) {
          this.logger.error(`Error setting checkbox ${selector} to ${check}:`, error);
          return false;
        }
    }

    public get config(): ActuatorConfig {
        return this._config;
    }
    public set config(value: ActuatorConfig) {
        this._config = value;
    }


}