// enhanced-ui-component.ts
import { injectable, inject } from 'inversify';
import { IUIComponent, RecordingStatus, TYPES, ErrorType } from '../types';
import { EventBus, VoiceLibEvents } from '../eventbus';
import { StateStore } from '../stateStore';
import { UIConfig } from './model/uiConfig';

@injectable()
export class UIComponent implements IUIComponent {
  private container: HTMLElement | null = null;
  private actionButton: HTMLButtonElement | null = null;
  private statusDisplay: HTMLDivElement | null = null;
  private transcriptionDisplay: HTMLDivElement | null = null;
  private recordingIndicator: HTMLSpanElement | null = null;
  private transcription: string | null = null;
  
  constructor(
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore
  ) {
    // Subscribe to events
    this.eventBus.on(VoiceLibEvents.TRANSCRIPTION_COMPLETED, this.handleTranscription.bind(this));
    this.eventBus.on(VoiceLibEvents.ERROR_OCCURRED, this.handleError.bind(this));
  }
  
  public init(config: UIConfig): void {
    this.container = config.container;
    this.container.classList.add('voice-recorder-container');
    
    this.injectStyles();
    this.createUIElements();
    this.setupEventListeners();
    this.updateFromState();
  }
  
  public updateFromState(): void {
    if (!this.container) return;
    
    const state = this.stateStore.getState();
    this.updateStatusDisplay(state.recordingStatus);
    this.updateButton(state.recordingStatus);
    
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
  
  private handleTranscription(transcription: string): void {
    this.setTranscription(transcription);
  }
  
  private handleError(error: unknown): void {
    // Display a user-friendly message instead of the actual error
    const userMessage = this.getUserFriendlyErrorMessage(error);
    
    if (this.statusDisplay) {
      this.statusDisplay.textContent = userMessage;
      this.statusDisplay.classList.add('error-state');
      
      // Auto-clear the error state after 3 seconds
      setTimeout(() => {
        if (this.statusDisplay) {
          this.statusDisplay.classList.remove('error-state');
          this.statusDisplay.textContent = 'Click mic button';
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
  
  private updateStatusDisplay(status: RecordingStatus): void {
    if (!this.statusDisplay) return;
    
    // Reset status display styling
    this.statusDisplay.classList.remove('error-state');
    
    switch (status) {
      case RecordingStatus.IDLE:
        this.statusDisplay.textContent = 'Click mic button';
        break;
      case RecordingStatus.RECORDING:
        this.statusDisplay.textContent = 'Recording...';
        break;
      case RecordingStatus.PROCESSING:
        this.statusDisplay.textContent = 'Processing...';
        break;
      case RecordingStatus.ERROR:
        // Don't update text here - let the error handler set the message
        this.statusDisplay.classList.add('error-state');
        break;
    }
    
    // Handle recording indicator
    this.updateRecordingIndicator(status === RecordingStatus.RECORDING);
    
    // Hide transcription when returning to idle if it's empty
    if (status === RecordingStatus.IDLE && this.transcriptionDisplay) {
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
  
  private updateButton(status: RecordingStatus): void {
    if (!this.actionButton) return;
    
    // Common button reset
    this.actionButton.disabled = false;
    
    switch (status) {
      case RecordingStatus.IDLE:
        this.setButtonAppearance('record');
        break;
      case RecordingStatus.RECORDING:
        this.setButtonAppearance('stop');
        break;
      case RecordingStatus.PROCESSING:
        this.setButtonAppearance('processing');
        this.actionButton.disabled = true;
        break;
      case RecordingStatus.ERROR:
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
  
  private createUIElements(): void {
    if (!this.container) return;
    this.container.innerHTML = '';
    
    // Create main interface container
    const interfaceContainer = document.createElement('div');
    interfaceContainer.className = 'voice-interface';
    
    // Create button container (circular)
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Create single action button
    this.actionButton = document.createElement('button');
    this.actionButton.className = 'action-button record-mode';
    this.actionButton.setAttribute('data-action', 'record');
    this.actionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 15c2.21 0 4-1.79 4-4V5c0-2.21-1.79-4-4-4S8 2.79 8 5v6c0 2.21 1.79 4 4 4zm0-2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2zm4 2v1c0 2.76-2.24 5-5 5s-5-2.24-5-5v-1H4v1c0 3.53 2.61 6.43 6 6.92V23h4v-2.08c3.39-.49 6-3.39 6-6.92v-1h-2z" fill="currentColor"/></svg>';
    
    buttonContainer.appendChild(this.actionButton);
    
    // Status display
    this.statusDisplay = document.createElement('div');
    this.statusDisplay.className = 'status-display';
    this.statusDisplay.textContent = 'Click mic button';
    
    // Add button and status to interface
    interfaceContainer.appendChild(buttonContainer);
    interfaceContainer.appendChild(this.statusDisplay);
    
    // Transcription area (hidden initially)
    this.transcriptionDisplay = document.createElement('div');
    this.transcriptionDisplay.className = 'transcription-display';
    this.transcriptionDisplay.textContent = '';
    this.transcriptionDisplay.style.display = 'none'; // Hide initially
    
    this.container.appendChild(interfaceContainer);
    this.container.appendChild(this.transcriptionDisplay);
  }
  
  private setupEventListeners(): void {
    if (!this.actionButton) return;
    
    this.actionButton.addEventListener('click', () => {
      if (!this.actionButton) return;
      
      const action = this.actionButton.getAttribute('data-action');
      if (action === 'record') {
        this.eventBus.emit(VoiceLibEvents.RECORD_BUTTON_PRESSED);
      } else if (action === 'stop') {
        this.eventBus.emit(VoiceLibEvents.STOP_BUTTON_PRESSED);
      }
    });
  }
  
  private injectStyles(): void {
    const styleId = 'voice-recorder-styles';
    if (document.getElementById(styleId)) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      .voice-recorder-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 240px;
        margin: 0;
        background-color: #f5f5f5;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }
      
      .voice-interface {
        display: flex;
        align-items: center;
        padding: 10px;
        background-color: #f5f5f5;
        gap: 8px;
      }
      
      .button-container {
        width: 40px;
        height: 40px;
        background-color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        flex-shrink: 0;
      }
      
      .action-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
        background-color: transparent;
      }
      
      .action-button svg {
        width: 20px;
        height: 20px;
      }
      
      .action-button.record-mode {
        color: #5A67D8;
      }
      
      .action-button.record-mode:hover:not(:disabled) {
        background-color: rgba(90, 103, 216, 0.1);
      }
      
      .action-button.stop-mode {
        color: #E53E3E;
      }
      
      .action-button.stop-mode:hover:not(:disabled) {
        background-color: rgba(229, 62, 62, 0.1);
      }
      
      .action-button.processing-mode {
        color: #718096;
        cursor: not-allowed;
      }
      
      .action-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .status-display {
        font-size: 14px;
        text-align: left;
        color: #4A5568;
        font-weight: 400;
        flex-grow: 1;
        padding: 0 8px;
        border: 1px solid transparent;
        border-radius: 4px;
        line-height: 26px;
        height: auto;
        transition: all 0.2s ease;
        white-space: normal;
        word-break: break-word;
      }

      
      .status-display.error-state {
        font-size: 11px;
        color: #c62828;
        background-color: #ffebee;
        border-color: #f5c6cb;
      }
      
      .transcription-display {
        padding: 10px;
        min-height: 30px;
        max-height: 120px;
        overflow-y: auto;
        background-color: white;
        font-size: 13px;
        line-height: 1.4;
        white-space: pre-wrap;
        border-top: 1px solid #e0e0e0;
        color: #2D3748;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      // .recording-indicator {
      //   display: inline-block;
      //   width: 8px;
      //   height: 8px;
      //   background-color: #E53E3E;
      //   border-radius: 50%;
      //   margin-right: 8px;
      //   animation: pulse 1.5s infinite;
      // }
      
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @media (max-width: 480px) {
        .voice-recorder-container {
          max-width: 100%;
          border-radius: 0;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
  }
}