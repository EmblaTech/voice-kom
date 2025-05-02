// enhanced-ui-component.ts
import { injectable, inject } from 'inversify';
import { IUIComponent, RecordingStatus, TYPES } from '../types';
import { EventBus, VoiceLibEvents } from '../eventbus';
import { StateStore } from '../stateStore';

@injectable()
export class UIComponent implements IUIComponent {
  private container: HTMLElement | null = null;
  private recordButton: HTMLButtonElement | null = null;
  private stopButton: HTMLButtonElement | null = null;
  private statusDisplay: HTMLDivElement | null = null;
  private transcriptionDisplay: HTMLDivElement | null = null;
  private recordingIndicator: HTMLSpanElement | null = null;
  private transcription: string | null = null;
  
  constructor(
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore
  ) {}
  
  public init(container: HTMLElement): void {
    this.container = container;
    
    // Add the container class
    this.container.classList.add('voice-recorder-container');
    
    // Inject CSS styles
    this.injectStyles();
    
    // Create UI elements
    this.createUIElements();
    
    // Set up event listeners for UI controls
    this.setupEventListeners();
    
    // Initial update from state
    this.updateFromState();
  }
  
  public updateFromState(): void {
    if (!this.container) return;
    
    const state = this.stateStore.getState();
    
    // Update status display and recording indicator
    if (this.statusDisplay) {
      this.statusDisplay.textContent = `Status: ${state.recordingStatus}`;
      
      // Handle recording indicator
      if (state.recordingStatus === RecordingStatus.RECORDING) {
        if (!this.recordingIndicator) {
          this.recordingIndicator = document.createElement('span');
          this.recordingIndicator.className = 'recording-indicator';
          this.statusDisplay.prepend(this.recordingIndicator);
        }
      } else if (this.recordingIndicator && this.recordingIndicator.parentNode === this.statusDisplay) {
        this.statusDisplay.removeChild(this.recordingIndicator);
        this.recordingIndicator = null;
      }
    }
    
    // Update buttons based on state
    if (this.recordButton && this.stopButton) {
      switch (state.recordingStatus) {
        case RecordingStatus.IDLE:
          this.recordButton.disabled = false;
          this.stopButton.disabled = true;
          break;
        case RecordingStatus.RECORDING:
          this.recordButton.disabled = true;
          this.stopButton.disabled = false;
          break;
        case RecordingStatus.PROCESSING:
          this.recordButton.disabled = true;
          this.stopButton.disabled = true;
          break;
        case RecordingStatus.ERROR:
          this.recordButton.disabled = false;
          this.stopButton.disabled = true;
          break;
      }
    }
    
    // Update transcription display
    if (this.transcriptionDisplay && this.transcription) {
      this.transcriptionDisplay.textContent = this.transcription;
    }
    
    // If there's an error, show it
    if (state.error) {
      console.error('Error in UI:', state.error);
      this.showError(state.error);
    }
  }
  
  public setTranscription(transcription: string): void {
    this.transcription = transcription;
    
    // Update the display if it exists
    if (this.transcriptionDisplay) {
      this.transcriptionDisplay.textContent = transcription;
    }
  }
  
  private createUIElements(): void {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Voice Recorder';
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    this.container.appendChild(title);
    
    // Create control buttons
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'voice-controls';
    
    // Record button
    this.recordButton = document.createElement('button');
    this.recordButton.textContent = 'Start Recording';
    this.recordButton.className = 'record-button';
    controlsDiv.appendChild(this.recordButton);
    
    // Stop button
    this.stopButton = document.createElement('button');
    this.stopButton.textContent = 'Stop Recording';
    this.stopButton.className = 'stop-button';
    this.stopButton.disabled = true;
    controlsDiv.appendChild(this.stopButton);
    
    // Status display
    this.statusDisplay = document.createElement('div');
    this.statusDisplay.className = 'status-display';
    this.statusDisplay.textContent = 'Status: idle';
    
    // Transcription label
    const transcriptionLabel = document.createElement('div');
    transcriptionLabel.textContent = 'Transcription:';
    transcriptionLabel.style.fontWeight = 'bold';
    transcriptionLabel.style.marginBottom = '5px';
    transcriptionLabel.style.marginTop = '10px';
    
    // Transcription display
    this.transcriptionDisplay = document.createElement('div');
    this.transcriptionDisplay.className = 'transcription-display';
    this.transcriptionDisplay.textContent = 'Transcription will appear here...';
    this.transcriptionDisplay.style.color = '#888';
    
    // Add elements to container
    this.container.appendChild(controlsDiv);
    this.container.appendChild(this.statusDisplay);
    this.container.appendChild(transcriptionLabel);
    this.container.appendChild(this.transcriptionDisplay);
  }
  
  private setupEventListeners(): void {
    if (this.recordButton) {
      this.recordButton.addEventListener('click', () => {
        this.eventBus.emit(VoiceLibEvents.RECORD_BUTTON_PRESSED);
      });
    }
    
    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => {
        this.eventBus.emit(VoiceLibEvents.STOP_BUTTON_PRESSED);
      });
    }
  }
  
  private showError(error: unknown): void {
    if (!this.container) return;
    
    // Remove any existing error messages
    const existingErrors = this.container.querySelectorAll('.error-message');
    existingErrors.forEach(element => {
      if (element.parentNode === this.container) {
        this.container?.removeChild(element);
      }
    });
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    
    this.container.appendChild(errorDiv);
    
    // Auto-remove after some time
    setTimeout(() => {
      if (errorDiv.parentNode === this.container) {
        this.container?.removeChild(errorDiv);
      }
    }, 5000);
  }
  
  private injectStyles(): void {
    // Check if styles already exist
    const styleId = 'voice-recorder-styles';
    if (document.getElementById(styleId)) {
      return;
    }
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      .voice-controls {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      
      .record-button, .stop-button {
        padding: 10px 16px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .record-button {
        background-color: #4caf50;
        color: white;
      }
      
      .record-button:hover:not(:disabled) {
        background-color: #43a047;
      }
      
      .stop-button {
        background-color: #f44336;
        color: white;
      }
      
      .stop-button:hover:not(:disabled) {
        background-color: #e53935;
      }
      
      button:disabled {
        background-color: #cccccc;
        color: #888888;
        cursor: not-allowed;
        box-shadow: none;
      }
      
      .status-display {
        font-size: 14px;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 4px;
        margin-bottom: 15px;
        border-left: 4px solid #2196f3;
      }
      
      .transcription-display {
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        min-height: 100px;
        max-height: 300px;
        overflow-y: auto;
        background-color: white;
        font-size: 16px;
        line-height: 1.6;
        white-space: pre-wrap;
        margin-bottom: 20px;
      }
      
      .error-message {
        background-color: #ffebee;
        color: #c62828;
        padding: 10px 15px;
        border-radius: 4px;
        margin-top: 10px;
        border-left: 4px solid #c62828;
        animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .voice-recorder-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        background-color: #fafafa;
      }
      
      .recording-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        background-color: #f44336;
        border-radius: 50%;
        margin-right: 8px;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @media (max-width: 480px) {
        .voice-controls {
          flex-direction: column;
        }
        
        .record-button, .stop-button {
          width: 100%;
          margin-bottom: 8px;
        }
      }
    `;
    
    // Append to document head
    document.head.appendChild(styleElement);
  }
}