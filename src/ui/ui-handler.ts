import { Logger } from '../utils/logger';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { ErrorType, Status, StatusType } from '../common/status';
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
      this.container = this.createDefaultUI(this.config.containerId!);
    }
    else {
      let existingContainer = document.getElementById(this.config.containerId);
      if (existingContainer) {
        this.container = existingContainer;
      } else {
        this.container = this.createDefaultUI(this.config.containerId);
      }
    }
    this.injectStyles();
    this.createUIElements();
    this.updateFromState();
  }

  private createDefaultUI(containerId: string): HTMLElement { 
    this.container = this.createContainer(containerId); 
    this.setUI(this.config!.position!, this.config!.width!, this.config!.height!, this.config!.styles! );
    return this.container;
  }

  private setUI(position: string, width: string, height: string, customStyles: {}): void {
    if (!this.container) return;
    
    // Apply base container class
    this.container.classList.add('voice-recorder-container');

    // Position settings
    if (position) {
      // Apply position class
      this.container.classList.add(`voice-${position}`);
    }
    
    // Apply dimensions
    if (width) {
      this.container.style.width = width;
    }
    
    if (height) {
      this.container.style.maxHeight = height;
    }
    
    // Apply any custom inline styles
    if (customStyles) {
      Object.keys(customStyles).forEach((key) => {
        //this.container.style[key as any] = customStyles[key];
      });
    }
  }

  private createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = id;
    this.config!.containerId = id;
    document.body.appendChild(container);
    return container;
  }
  
  private async injectStyles(): Promise<void> {
    if (document.getElementById(this.SPEECH_PLUG_STYLE_ELEMENT_ID)) return;
  
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = this.SPEECH_PLUG_STYLE_ELEMENT_ID;
  
    try {
    // Fetch CSS content from external file
      const response = await fetch(this.SPEECH_PLUG_STYLE_PATH);
    
      if (!response.ok) {
        this.logger.error(`Failed to load CSS: ${response.status} ${response.statusText}`);
      }
    
      // Get the CSS content and inject it
      const cssContent = await response.text();
      styleElement.textContent = cssContent;
      document.head.appendChild(styleElement);
      
    } catch (error) {
      this.logger.error('Error loading CSS:', error);
      // Fallback to embedded styles if loading fails
      throw Error('Failed to load CSS');
    }
  }

  private createUIElements(): void {
    if (!this.container) return;
    this.container.innerHTML = '';  

    fetch(this.SPEECH_PLUG_TEMPLATE_PATH)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load HTML template: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(htmlContent => {
      this.container!.innerHTML = htmlContent;
      this.actionButton = this.container!.querySelector('.action-button');
      this.statusDisplay = this.container!.querySelector('.status-display');
      this.transcriptionDisplay = this.container!.querySelector('.transcription-display');

      // Initialize any event listeners or additional configuration here
      if (this.actionButton) {
        this.bindEventListeners();
      }
    })
    .catch(error => {
      this.logger.error('Error loading UI template:', error);
      throw Error('Failed to load HTML template');
    });
  }

  private bindEventListeners(): void {
    if (!this.actionButton) return;

    this.actionButton.addEventListener('click', () => {
      if (!this.actionButton) return;

      const action = this.actionButton.getAttribute('data-action');
      if (action === 'record') {
        this.eventBus.emit(SpeechEvents.RECORD_BUTTON_PRESSED);
      } else if (action === 'stop') {
        this.eventBus.emit(SpeechEvents.STOP_BUTTON_PRESSED);
      }
    });
  }
  
  public updateFromState(): void {
    if (!this.container) return;
    
    const status = this.status.get();
    this.updateStatusDisplay(status.value);
    this.updateButton(status.value);    
    if (this.transcriptionDisplay && this.transcription) {
      this.transcriptionDisplay.textContent = this.transcription;
      this.transcriptionDisplay.style.display = 'block';
    }
  }

  public setTranscription(transcription: string): void {
    this.transcription = transcription;
    if (this.transcriptionDisplay) {
      this.transcriptionDisplay.textContent = transcription;
      // Show transcription area when we have content
      if (transcription && transcription.trim().length > 0) {
        this.transcriptionDisplay.style.display = 'block';
      }
    }
  }
  
  private onTranscriptionCompleted(transcription: string): void {
    this.setTranscription(transcription);
  }
  
  private onError(error: unknown): void {
    // Display a user-friendly message instead of the actual error
    const userMessage = this.getUserFriendlyErrorMessage(error);
    
    if (this.statusDisplay) {
      this.statusDisplay.textContent = userMessage;
      this.statusDisplay.classList.add('error-state');
      
      // Auto-clear the error state after 3 seconds
      setTimeout(() => {
        if (this.statusDisplay) {
          this.statusDisplay.classList.remove('error-state');
          this.statusDisplay.textContent = 'SpeechPlug';
        }
      }, 3000);
    }
    
    // Log the actual error to console for debugging
    console.error('Voice processing error:', error);
  }
  
  private getUserFriendlyErrorMessage(error: unknown): string {
    // Default user-friendly message
    let message = 'We ran into a small problem';
    
    // Check if it's a known error type that we want to give more specific feedback for
    if (error && typeof error === 'object') {
      if ('type' in error) {
        const errorType = (error as { type: ErrorType }).type;
        
        switch (errorType) {
          case ErrorType.MICROPHONE_ACCESS:
            message = 'Please allow microphone access';
            break;
          case ErrorType.TRANSCRIPTION:
            message = 'We ran into a small problem';
            break;
          case ErrorType.NETWORK:
            message = 'Network connection issue';
            break;
          // Add more specific error types as needed
        }
      }
    }
    
    return message;
  }
  
  private updateStatusDisplay(status: StatusType): void {
    if (!this.statusDisplay) return;
    
    // Reset status display styling
    this.statusDisplay.classList.remove('error-state');
    
    switch (status) {
      case StatusType.IDLE:
        this.statusDisplay.textContent = 'SpeechPlug';
        break;
      case StatusType.RECORDING:
        this.statusDisplay.textContent = 'Recording...';
        break;
      case StatusType.PROCESSING:
        this.statusDisplay.textContent = 'Processing...';
        break;
      case StatusType.ERROR:
        // Don't update text here - let the error handler set the message
        this.statusDisplay.classList.add('error-state');
        break;
    }
    
    // Handle recording indicator
    this.updateRecordingIndicator(status === StatusType.RECORDING);
    
    // Hide transcription when returning to idle if it's empty
    if (status === StatusType.IDLE && this.transcriptionDisplay) {
      if (!this.transcription || this.transcription.trim() === '') {
        this.transcriptionDisplay.style.display = 'none';
      }
    }
  }
  
  private updateRecordingIndicator(isRecording: boolean): void {
    if (isRecording) {
      if (!this.recordingIndicator && this.statusDisplay) {
        this.recordingIndicator = document.createElement('span');
        this.recordingIndicator.className = 'recording-indicator';
        this.statusDisplay.prepend(this.recordingIndicator);
      }
    } else if (this.recordingIndicator && this.recordingIndicator.parentNode) {
      this.recordingIndicator.parentNode.removeChild(this.recordingIndicator);
      this.recordingIndicator = null;
    }
  }
  
  private updateButton(status: StatusType): void {
    if (!this.actionButton) return;
    
    // Common button reset
    this.actionButton.disabled = false;
    
    switch (status) {
      case StatusType.IDLE:
        this.setButtonAppearance('record');
        break;
      case StatusType.RECORDING:
        this.setButtonAppearance('stop');
        break;
      case StatusType.PROCESSING:
        this.setButtonAppearance('processing');
        this.actionButton.disabled = true;
        break;
      case StatusType.ERROR:
        this.setButtonAppearance('record');
        break;
    }
  }
  
  private setButtonAppearance(mode: 'record' | 'stop' | 'processing'): void {
    if (!this.actionButton) return;
    
    // Reset classes first
    this.actionButton.className = 'action-button';
    
    switch (mode) {
      case 'record':
        this.actionButton.classList.add('record-mode');
        this.actionButton.setAttribute('data-action', 'record');
        this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 15c2.21 0 4-1.79 4-4V5c0-2.21-1.79-4-4-4S8 2.79 8 5v6c0 2.21 1.79 4 4 4zm0-2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2zm4 2v1c0 2.76-2.24 5-5 5s-5-2.24-5-5v-1H4v1c0 3.53 2.61 6.43 6 6.92V23h4v-2.08c3.39-.49 6-3.39 6-6.92v-1h-2z" fill="currentColor"/></svg>';
        break;
      case 'stop':
        this.actionButton.classList.add('stop-mode');
        this.actionButton.setAttribute('data-action', 'stop');
        this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M6 6h12v12H6z" fill="currentColor"/></svg>';
        break;
      case 'processing':
        this.actionButton.classList.add('processing-mode');
        this.actionButton.removeAttribute('data-action');
        this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z" fill="currentColor"><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></path></svg>';
        break;
    }
  }
}