// ui-component.ts
import { injectable, inject } from 'inversify';
import { IUIComponent, RecordingStatus, TYPES } from '../types';
import { EventBus, VoiceLibEvents } from '../eventbus';
import { StateStore } from '../stateStore';

@injectable()
export class UIComponent implements IUIComponent {
  private container: HTMLElement | null = null;
  private recordButton: HTMLButtonElement | null = null;
  private statusElement: HTMLElement | null = null;
  private transcriptionElement: HTMLElement | null = null;
  
  constructor(
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.StateStore) private stateStore: StateStore
  ) {}

  public init(container: HTMLElement): void {
    this.container = container;
    this.createUIElements();
    
    // Subscribe to state changes from the StateStore
    this.eventBus.on(VoiceLibEvents.STATE_CHANGED, () => {
      this.updateFromState();
    });
  }
  
  public updateFromState(): void {
    if (!this.statusElement || !this.recordButton || !this.transcriptionElement) return;
    
    const state = this.stateStore.getState();
    
    // Update UI based on current state
    this.updateStatus(state.recordingStatus);
    this.updateTranscription(state.transcription);
    
    // Handle error display if needed
    if (state.error) {
      console.error('VoiceLib error:', state.error);
      
      // Display error message in status if available
      if (this.statusElement && state.recordingStatus === RecordingStatus.ERROR) {
        this.statusElement.textContent = `Error: ${state.error.message || 'Unknown error'}`;
      }
    }
  }

  private createUIElements(): void {
    if (!this.container) return;
    
    // Clear existing content
    this.container.innerHTML = '';
    
    // Create main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'voice-lib-wrapper';
    
    // Create status element
    this.statusElement = document.createElement('div');
    this.statusElement.className = 'voice-lib-status';
    this.statusElement.textContent = 'Ready to record';
    wrapper.appendChild(this.statusElement);
    
    // Create record button
    this.recordButton = document.createElement('button');
    this.recordButton.className = 'voice-lib-record-button';
    this.recordButton.textContent = '🎤 Record';
    this.recordButton.addEventListener('click', () => {
      if (this.recordButton?.classList.contains('recording')) {
        // Currently recording, so this click should stop recording
        this.eventBus.emit(VoiceLibEvents.STOP_BUTTON_PRESSED);
      } else {
        // Not recording, so this click should start recording
        this.eventBus.emit(VoiceLibEvents.RECORD_BUTTON_PRESSED);
      }
    });
    wrapper.appendChild(this.recordButton);
    
    // Create transcription element
    this.transcriptionElement = document.createElement('div');
    this.transcriptionElement.className = 'voice-lib-transcription';
    this.transcriptionElement.textContent = 'No transcription available';
    wrapper.appendChild(this.transcriptionElement);
    
    // Append to container
    this.container.appendChild(wrapper);
    
    // Add basic styles
    const style = document.createElement('style');
    style.textContent = `
      .voice-lib-wrapper {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .voice-lib-status {
        margin-bottom: 10px;
        font-size: 14px;
        color: #666;
      }
      .voice-lib-record-button {
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.2s;
      }
      .voice-lib-record-button:hover {
        background-color: #0069d9;
      }
      .voice-lib-record-button.recording {
        background-color: #dc3545;
      }
      .voice-lib-transcription {
        margin-top: 20px;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
        min-height: 100px;
        background-color: #f9f9f9;
      }
    `;
    document.head.appendChild(style);
  }

  private updateTranscription(text: string): void {
    if (this.transcriptionElement) {
      this.transcriptionElement.textContent = text || 'No transcription available';
    }
  }

  private updateStatus(status: RecordingStatus): void {
    if (!this.statusElement || !this.recordButton) return;
    
    // Update status text
    switch (status) {
      case RecordingStatus.IDLE:
        this.statusElement.textContent = 'Ready to record';
        this.recordButton.textContent = '🎤 Record';
        this.recordButton.classList.remove('recording');
        this.recordButton.disabled = false;
        break;
      case RecordingStatus.RECORDING:
        this.statusElement.textContent = 'Recording...';
        this.recordButton.textContent = '⏹ Stop';
        this.recordButton.classList.add('recording');
        this.recordButton.disabled = false;
        break;
      case RecordingStatus.PROCESSING:
        this.statusElement.textContent = 'Processing audio...';
        this.recordButton.disabled = true;
        break;
      case RecordingStatus.ERROR:
        this.statusElement.textContent = 'Error occurred';
        this.recordButton.textContent = '🎤 Record';
        this.recordButton.classList.remove('recording');
        this.recordButton.disabled = false;
        break;
    }
  }
}