import { Logger } from '../utils/logger';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { ButtonMode, ErrorType, Status, StatusType, StatusMeta } from '../common/status';
import { UIConfig } from '../../src/types';

export class UIHandler {
  private config: UIConfig | null = null;
  private readonly logger = Logger.getInstance();
  private readonly SPEECH_PLUG_TEMPLATE_PATH = '../../src/ui/speech-container.html';
  private readonly SPEECH_PLUG_STYLE_ELEMENT_ID = 'speech-container-style';
  private readonly SPEECH_PLUG_STYLE_PATH = '../../src/ui/speech-container.css';

  private container: HTMLElement | null = null;
  private actionButton: HTMLButtonElement | null = null;
  private statusDisplay: HTMLDivElement | null = null;
  private transcriptionDisplay: HTMLDivElement | null = null;
  private recordingIndicator: HTMLSpanElement | null = null;
  private transcription: string | null = null;
  private readonly BUTTON_ERROR_RESET_DELAY_MS = 3000;

  private readonly ACTION_BUTTON_CLASS = '.action-button';
  private readonly STATUS_DISPLAY_CLASS = '.status-display';
  private readonly TRANSCRIPTION_DISPLAY_CLASS = '.transcription-display';

  private readonly STATUS_CONFIG: Record<StatusType, StatusMeta> = {
    [StatusType.IDLE]: {
      code:       StatusType.IDLE,
      text:       'SpeechPlug',
      buttonMode: ButtonMode.RECORD,
      icon:       'mic'
    },
    [StatusType.RECORDING]: {
      code:       StatusType.RECORDING,
      text:       'Recording...',
      buttonMode: ButtonMode.STOP,
      icon:       'mic_off'
    },
    [StatusType.PROCESSING]: {
      code:       StatusType.PROCESSING,
      text:       'Processing...',
      buttonMode: ButtonMode.PROCESSING,
      icon:       'hourglass'
    },
    [StatusType.ERROR]: {
      code:       StatusType.ERROR,
      text:       '',
      buttonMode: ButtonMode.RECORD,
      icon:       'error'
    },
    [StatusType.WAITING]: {
      code:       StatusType.WAITING,
      text:       'Waiting...',
      buttonMode: ButtonMode.RECORD,
      icon:       'schedule'
    },
    [StatusType.EXECUTING]: {
      code:       StatusType.EXECUTING,
      text:       'Executing...',
      buttonMode: ButtonMode.RECORD,
      icon:       'play_arrow'
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
    
    if(!this.config.containerId) { //Determine if we need to create a default container or use an existing one
      this.container = await this.createDefaultUI(this.config.containerId!);
    } else {
      let existingContainer = document.getElementById(this.config.containerId);
      if (existingContainer) {
        this.container = existingContainer;
      } else {
        this.container = await this.createDefaultUI(this.config.containerId);
      }
    }
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
    if (document.getElementById(this.SPEECH_PLUG_STYLE_ELEMENT_ID)) return;

    try {
      const styleElement = document.createElement('style');
      styleElement.id = this.SPEECH_PLUG_STYLE_ELEMENT_ID;
      // Fetch CSS content from default file
      const cssContent = await this.fetchContent(this.SPEECH_PLUG_STYLE_PATH);
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
      const cssContent = await this.fetchContent(fileStyles);
      const cssProperties = this.parse(cssContent);
      const customStyles = this.toCamelCase(cssProperties);
      this.logger.info(`Custom file styles will take precedence, when multiple styles apply to the same style attribute`);
      return (inlineStyles ? this.mergeStyles(customStyles, inlineStyles) : customStyles);
    }
    return inlineStyles || {};
  }

  private async fetchContent(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`Failed to fetch resource at ${url}: ${response.status} ${response.statusText}`);
      }
      return response.text();
    } catch (error) {
      this.logger.error(`Error fetching resource at ${url}: ${error}`);
      throw Error(`Error fetching resource at ${url}: ${error}`);
    }
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
      const htmlContent = await this.fetchContent(this.SPEECH_PLUG_TEMPLATE_PATH);
      this.container.innerHTML = htmlContent;
      this.actionButton = this.container.querySelector(this.ACTION_BUTTON_CLASS);
      this.statusDisplay = this.container.querySelector(this.STATUS_DISPLAY_CLASS);
      this.transcriptionDisplay = this.container.querySelector(this.TRANSCRIPTION_DISPLAY_CLASS);
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
    this.showTranscripton();
  }

  public setTranscription(transcription: string): void {
    this.transcription = transcription;
    this.showTranscripton();
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
    if (status === StatusType.IDLE) this.hideTransaction();
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
    this.setButtonAppearance(this.STATUS_CONFIG[status].buttonMode);
  }

  private setButtonAppearance(mode: ButtonMode): void {
    if (!this.actionButton) return;
    this.actionButton.className = 'action-button';
    switch (mode) {
      case ButtonMode.RECORD:
        this.actionButton.classList.add('record-mode');
        this.actionButton.setAttribute('data-action', ButtonMode.RECORD);
        this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 15c2.21 0 4-1.79 4-4V5c0-2.21-1.79-4-4-4S8 2.79 8 5v6c0 2.21 1.79 4 4 4zm0-2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2zm4 2v1c0 2.76-2.24 5-5 5s-5-2.24-5-5v-1H4v1c0 3.53 2.61 6.43 6 6.92V23h4v-2.08c3.39-.49 6-3.39 6-6.92v-1h-2z" fill="currentColor"/></svg>';
        break;
      case ButtonMode.STOP:
        this.actionButton.classList.add('stop-mode');
        this.actionButton.setAttribute('data-action', ButtonMode.STOP);
        this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M6 6h12v12H6z" fill="currentColor"/></svg>';
        break;
      case ButtonMode.PROCESSING:
        this.actionButton.classList.add('processing-mode');
        this.actionButton.removeAttribute('data-action');
        this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z" fill="currentColor"><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></path></svg>';
        break;
    }
  }

  private showTranscripton(): void {
    if (!this.transcriptionDisplay) return;
    this.transcriptionDisplay.textContent = this.transcription || '';
    this.transcriptionDisplay.style.display =
      this.transcription && this.transcription.trim().length > 0 ? 'block' : 'none';
  }

  private hideTransaction(): void {
    if (this.transcriptionDisplay && (!this.transcription || this.transcription.trim() === '')) {
      this.transcriptionDisplay.style.display = 'none';
    }
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
    }, this.BUTTON_ERROR_RESET_DELAY_MS);
  }
}