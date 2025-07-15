import { Logger } from '../utils/logger';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { ButtonMode, ErrorType, Status, StatusType, StatusMeta } from '../common/status';
import { UIConfig } from '../../src/types';
import { fetchContent } from '../utils/resource-fetcher';

export class UIHandler {
  private config: UIConfig | null = null;
  private readonly logger = Logger.getInstance();
  
  // Paths and Identifiers
  private readonly TEMPLATE_PATH = '../../src/ui/speech-container.html';
  private readonly STYLE_ELEMENT_ID = 'speech-container-style';
  private readonly STYLE_PATH = '../../src/ui/speech-container.css';

  // UI Elements
  private container: HTMLElement | null = null;
  private actionButton: HTMLButtonElement | null = null;
  private statusDisplay: HTMLDivElement | null = null;
  private transcriptionDisplay: HTMLDivElement | null = null;
  private recordingIndicator: HTMLSpanElement | null = null;

  // State
  private transcription: string | null = null;

  // Constants
  private readonly ERROR_RESET_DELAY_MS = 3000;
  private readonly SVG_ICONS = {
    RECORD: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 15c2.21 0 4-1.79 4-4V5c0-2.21-1.79-4-4-4S8 2.79 8 5v6c0 2.21 1.79 4 4 4zm0-2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2zm4 2v1c0 2.76-2.24 5-5 5s-5-2.24-5-5v-1H4v1c0 3.53 2.61 6.43 6 6.92V23h4v-2.08c3.39-.49 6-3.39 6-6.92v-1h-2z" fill="currentColor"/></svg>',
    STOP: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M6 6h12v12H6z" fill="currentColor"/></svg>',
    PROCESSING: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z" fill="currentColor"><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></path></svg>'
  };

  // CSS Class Selectors
  private readonly ACTION_BUTTON_SELECTOR = '.action-button';
  private readonly STATUS_DISPLAY_SELECTOR = '.status-display';
  private readonly TRANSCRIPTION_DISPLAY_SELECTOR = '.transcription-display';

  private readonly STATUS_CONFIG: Record<StatusType, StatusMeta> = {
    [StatusType.IDLE]: {
      code: StatusType.IDLE,
      text: 'SpeechPlug',
      buttonMode: ButtonMode.RECORD,
      icon: 'mic',
      cssClass: 'record-mode',
      dataAction: ButtonMode.RECORD,   
      innerHTML: this.SVG_ICONS.RECORD
    },
    [StatusType.RECORDING]: {
      code: StatusType.RECORDING,
      text: 'Recording...',
      buttonMode: ButtonMode.STOP,
      icon: 'mic_off',
      cssClass: 'stop-mode',
      dataAction: ButtonMode.STOP,     
      innerHTML: this.SVG_ICONS.STOP
    },
    [StatusType.PROCESSING]: {
      code: StatusType.PROCESSING,
      text: 'Processing...',
      buttonMode: ButtonMode.PROCESSING,
      icon: 'hourglass',
      cssClass: 'processing-mode',    
      innerHTML: this.SVG_ICONS.PROCESSING
    },
    [StatusType.ERROR]: {
      code: StatusType.ERROR,
      text: '',
      buttonMode: ButtonMode.RECORD,
      icon: 'error',
      cssClass: 'record-mode',
      dataAction: ButtonMode.RECORD,    
      innerHTML: this.SVG_ICONS.RECORD
    },
    [StatusType.WAITING]: {
      code: StatusType.WAITING,
      text: 'Waiting...',
      buttonMode: ButtonMode.RECORD,
      icon: 'schedule',
      cssClass: 'record-mode',
      dataAction: ButtonMode.RECORD,   
      innerHTML: this.SVG_ICONS.RECORD
    },
    [StatusType.EXECUTING]: {
      code: StatusType.EXECUTING,
      text: 'Executing...',
      buttonMode: ButtonMode.PROCESSING,
      icon: 'play_arrow',
      cssClass: 'processing-mode',    
      innerHTML: this.SVG_ICONS.RECORD
    }
  };

  constructor(
    private readonly eventBus: EventBus,
    private readonly status: Status
  ) {
    // Subscribe to events
    this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, this.onTranscriptionCompleted.bind(this));
    this.eventBus.on(SpeechEvents.ERROR_OCCURRED, this.onError.bind(this));
  }
  
  public async init(config: UIConfig): Promise<void> {
    // Merge provided config with defaults
    this.config = config;
    
    const containerId = this.config.containerId;
    this.container = containerId ? document.getElementById(containerId) : null;
    
    this.container ??= await this.createDefaultUI(containerId!);
    this.updateUIStatus();
  }

  private async createDefaultUI(containerId: string): Promise<HTMLElement> { 
    this.container = this.createContainer(containerId); 
    await this.setUI(this.config!.position!, this.config!.width!, this.config!.height!);
    return this.container;
  }

  private async setUI(position: string, width: string, height: string): Promise<void> {
    if (!this.container) return;
    
    // Apply base container class
    this.container.classList.add('voice-recorder-container');
    if (position) {     
      this.container.classList.add(`voice-${position}`);  // Apply position class
    } 
    if (width) {
      this.container.style.width = width;
    } 
    if (height) {
      this.container.style.height = height;
    }
    await this.createUIElements();
    await this.injectStyles(this.container, this.config?.styleUrl, this.config?.styles);   
  }

  private createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = id;
    this.config!.containerId = id;
    document.body.appendChild(container);
    return container;
  }
  
  private async injectStyles(container: any, fileStyles: string | undefined, inlineStyles: any): Promise<void> {
    if (document.getElementById(this.STYLE_ELEMENT_ID)) return;

    try {
      const styleElement = document.createElement('style');
      styleElement.id = this.STYLE_ELEMENT_ID;
      // Fetch CSS content from default file
      const cssContent = await fetchContent(this.STYLE_PATH);
      styleElement.textContent = cssContent;
      document.head.appendChild(styleElement);

      let finalStyles = inlineStyles || {};
      finalStyles = await this.finalizeStyles(fileStyles, inlineStyles);         
      Object.assign(container.style, finalStyles);
    } catch (error) {
      this.logger.error('Error injectStyles(): ', error);
      // Fallback to embedded styles if loading fails
      throw Error(`Error injectStyles(): ${error}`);
    }
  }

  async finalizeStyles(fileStyles: string | undefined, inlineStyles: any) {
    if (fileStyles) {
      // Fetch CSS content from custom file
      const cssContent = await fetchContent(fileStyles);
      const cssProperties = this.parse(cssContent);
      const customStyles = this.toCamelCase(cssProperties);
      this.logger.info(`Custom file styles will take precedence, when multiple styles apply to the same style attribute`);
      return (inlineStyles ? this.mergeStyles(customStyles, inlineStyles) : customStyles);
    }
    return inlineStyles || {};
  }

  // Parsing CSS and Clean CSS string and extract properties
  private parse(cssContent: string): Record<string, string> {
    const cssProperties: Record<string, string> = {};
    const cleanedCss = cssContent.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const cssBlocks = cleanedCss.split('}').filter(block => block.trim());

    cssBlocks.forEach(cssBlock => {
      const parts = cssBlock.split('{');
      if (parts.length !== 2) return;
      const cssAttributes = parts[1].trim();
      const cssPropertiesArray = cssAttributes.split(';').filter(cssProperty => cssProperty.trim());
      cssPropertiesArray.forEach(declaration => {
        const [cssProperty, value] = declaration.split(':').map(part => part.trim());
        if (cssProperty && value) {
          cssProperties[cssProperty] = value;
        }
      });
    });
    return cssProperties;
  }

  private toCamelCase(cssProperties: Record<string, string>): Record<string, string> {
    const camelCaseProperties: Record<string, string> = {};
    Object.entries(cssProperties).forEach(([kebabProperty, value]) => {
      const camelCaseProperty = kebabProperty.replace(/-([a-z])/g, (match: any, letter: any) => letter.toUpperCase());
      camelCaseProperties[camelCaseProperty] = value;
    });
    return camelCaseProperties;
  }

  // Merge styles of custom styles and script.js styles (avoiding duplicates)
  mergeStyles(primaryStyles: any, secondaryStyles: any) {
    const mergedStyles = { ...primaryStyles };
    Object.keys(secondaryStyles).forEach(property => {
      if (!mergedStyles.hasOwnProperty(property)) {
        mergedStyles[property] = secondaryStyles[property];
      }
    });
    return mergedStyles;
  }

  private async createUIElements(): Promise<void> {
    if (!this.container) return;
    this.container.innerHTML = '';  

    try {
      const htmlContent = await fetchContent(this.TEMPLATE_PATH);
      this.container.innerHTML = htmlContent;
      this.actionButton = this.container.querySelector(this.ACTION_BUTTON_SELECTOR);
      this.statusDisplay = this.container.querySelector(this.STATUS_DISPLAY_SELECTOR);
      this.transcriptionDisplay = this.container.querySelector(this.TRANSCRIPTION_DISPLAY_SELECTOR);
      // Initialize any event listeners or additional configuration here
      if (this.actionButton) {
        this.bindEventListeners();
      }
    } catch (error) {
      this.logger.error('Error loading UI template:', error);
      throw new Error('Failed to load HTML template');
    }
  }

  private bindEventListeners(): void {
    if (!this.actionButton) return;

    this.actionButton.addEventListener('click', () => {
      if (!this.actionButton) return;

      const action = this.actionButton.getAttribute('data-action');
      if (action === ButtonMode.RECORD) {
        this.eventBus.emit(SpeechEvents.RECORD_BUTTON_PRESSED);
      } else if (action === ButtonMode.STOP) {
        this.eventBus.emit(SpeechEvents.STOP_BUTTON_PRESSED);
      }
    });
  }
  
  public updateUIStatus(): void {
    if (!this.container) return;
    const status = this.status.get().value;
    this.showStatus(status);
    this.setActionButton(status);
    this.syncTranscriptionDisplay();
  }

  public setTranscription(transcription: string): void {
    this.transcription = transcription;
    this.syncTranscriptionDisplay();
  }

  private onTranscriptionCompleted(transcription: string): void {
    this.setTranscription(transcription);
  }

  private onError(error: unknown): void {
    const userMessage = this.getMessage(error);
    this.showError(userMessage);
    this.logger.error('Voice processing error: ', error);
  }

  private getMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'type' in error) {
      switch ((error as { type: ErrorType }).type) {
        case ErrorType.MICROPHONE_ACCESS:
          return 'Please allow microphone access';
        case ErrorType.NETWORK:
          return 'Network connection issue';
        // Add more specific error types as needed
      }
    }
    return 'We ran into a small problem';
  }

  private showStatus(status: StatusType): void {
    if (!this.statusDisplay) return;
    this.statusDisplay.classList.remove('error-state');
    if (status !== StatusType.ERROR) {
      this.statusDisplay.textContent = this.STATUS_CONFIG[status].text;
    } else {
      this.statusDisplay.classList.add('error-state');
    }
    this.updateRecordingIndicator(status === StatusType.RECORDING);
    if (status === StatusType.IDLE) this.syncTranscriptionDisplay();
  }

  private updateRecordingIndicator(isRecording: boolean): void {
    if (!this.statusDisplay) return;
    if (isRecording) {
      if (!this.recordingIndicator) {
        this.recordingIndicator = document.createElement('span');
        this.recordingIndicator.className = 'recording-indicator';
        this.statusDisplay.prepend(this.recordingIndicator);
      }
    } else if (this.recordingIndicator?.parentNode) {
      this.recordingIndicator.parentNode.removeChild(this.recordingIndicator);
      this.recordingIndicator = null;
    }
  }

  private setActionButton(status: StatusType): void {
    if (!this.actionButton) return;
    this.actionButton.disabled = status === StatusType.PROCESSING;
    this.setButtonAppearance(status);
  }

  private setButtonAppearance(status: StatusType): void {
    if (!this.actionButton) return;
    const statusMeta = this.STATUS_CONFIG[status];
    this.actionButton.className = 'action-button';
    this.actionButton.classList.add(statusMeta.cssClass);
    this.actionButton.innerHTML = statusMeta.innerHTML;
    if (statusMeta.dataAction) {
      this.actionButton.setAttribute('data-action', statusMeta.dataAction);
    } else {
      this.actionButton.removeAttribute('data-action');
    }
  }

  private syncTranscriptionDisplay(): void {
    if (!this.transcriptionDisplay) return;
    const trimmed = this.transcription?.trim() ?? '';
    const hasContent = trimmed.length > 0;
    this.transcriptionDisplay.textContent = hasContent ? trimmed : '';
    this.transcriptionDisplay.style.display = hasContent ? 'block' : 'none';
    hasContent ? this.expandContainer() : this.resetContainerSize();
  }

  private expandContainer(): void {
    if (!this.container) return;
    this.container.style.maxHeight = 'none';
    this.container.style.height = 'auto';
  }

  private resetContainerSize(): void {
    if (!this.container) return;
    this.container.style.maxHeight = '75px';
    this.container.style.height = 'auto';
  }

  private showError(message: string): void {
    if (!this.statusDisplay) return;
    this.statusDisplay.textContent = message;
    this.statusDisplay.classList.add('error-state');
    setTimeout(() => {
      if (this.statusDisplay) {
        this.statusDisplay.classList.remove('error-state');
        this.statusDisplay.textContent = this.STATUS_CONFIG[StatusType.IDLE].text;
      }
    }, this.ERROR_RESET_DELAY_MS);
  }
}