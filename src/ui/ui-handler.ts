import { Logger } from '../utils/logger';
import { EventBus, SpeechEvents } from '../common/eventbus';
import { ButtonMode, ErrorType, Status, StatusType, StatusMeta } from '../common/status';
import { UIConfig } from '../../src/types';

// --- START: MODIFICATION ---
// 1. Import the HTML and CSS files directly.
//    Webpack (with the config from the previous step) will replace these
//    with the raw text content of the files at build time.
//    The path is relative to this file.
import htmlTemplate from './assets/widget.html';
import defaultStyles from './assets/style.css';

// 2. REMOVED: The runtime fetcher is no longer needed for internal assets.
// import { fetchContent } from '../utils/resource-fetcher';
// --- END: MODIFICATION ---

export class UIHandler {
  private config: UIConfig | null = null;
  private readonly logger = Logger.getInstance();

  // --- START: MODIFICATION ---
  // 3. REMOVED: These path constants are no longer needed.
  // private readonly TEMPLATE_PATH = ...
  // private readonly STYLE_PATH = ...
  private readonly STYLE_ELEMENT_ID = 'speech-widget-style';
  // --- END: MODIFICATION ---

  // UI Elements
  private widget: HTMLElement | null = null;
  private actionButton: HTMLButtonElement | null = null;
  private buttonWidget: HTMLElement | null = null;
  private statusDisplay: HTMLDivElement | null = null;
  private transcriptionDisplay: HTMLDivElement | null = null;
  private recordingIndicator: HTMLSpanElement | null = null;

  // State
  private transcription: string | null = null;

  // Constants
  private readonly SVG_ICONS = {
    RECORD: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 15c2.21 0 4-1.79 4-4V5c0-2.21-1.79-4-4-4S8 2.79 8 5v6c0 2.21 1.79 4 4 4zm0-2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2zm4 2v1c0 2.76-2.24 5-5 5s-5-2.24-5-5v-1H4v1c0 3.53 2.61 6.43 6 6.92V23h4v-2.08c3.39-.49 6-3.39 6-6.92v-1h-2z" fill="currentColor"/></svg>',
    STOP: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M6 6h12v12H6z" fill="currentColor"/></svg>',
    PROCESSING: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z" fill="currentColor"><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></path></svg>'
  };

  // CSS Class Selectors
  private readonly ACTION_BUTTON_SELECTOR = '.action-button';
  private readonly BUTTON_WIDGET_SELECTOR = '.button-widget';
  private readonly STATUS_DISPLAY_SELECTOR = '.status-display';
  private readonly TRANSCRIPTION_DISPLAY_SELECTOR = '.transcription-display';

  private readonly STATUS_CONFIG: Record<StatusType, StatusMeta> = {
    [StatusType.IDLE]: { code: StatusType.IDLE, text: 'Voice Kom', buttonMode: ButtonMode.RECORD, icon: 'mic', cssClass: 'record-mode', dataAction: ButtonMode.RECORD, innerHTML: this.SVG_ICONS.RECORD },
    [StatusType.RECORDING]: { code: StatusType.RECORDING, text: 'Recording...', buttonMode: ButtonMode.STOP, icon: 'mic_off', cssClass: 'recording-mode', dataAction: ButtonMode.STOP, innerHTML: this.SVG_ICONS.STOP },
    [StatusType.PROCESSING]: { code: StatusType.PROCESSING, text: 'Processing...', buttonMode: ButtonMode.PROCESSING, icon: 'hourglass', cssClass: 'processing-mode', innerHTML: this.SVG_ICONS.PROCESSING },
    [StatusType.ERROR]: { code: StatusType.ERROR, text: '', buttonMode: ButtonMode.RECORD, icon: 'error', cssClass: 'record-mode', dataAction: ButtonMode.RECORD, innerHTML: this.SVG_ICONS.RECORD },
    [StatusType.WAITING]: { code: StatusType.WAITING, text: "Say 'Hey VoiceKom'", buttonMode: ButtonMode.RECORD, icon: 'hearing', cssClass: 'record-mode', dataAction: ButtonMode.RECORD, innerHTML: this.SVG_ICONS.RECORD },
    [StatusType.EXECUTING]: { code: StatusType.EXECUTING, text: 'Executing...', buttonMode: ButtonMode.PROCESSING, icon: 'play_arrow', cssClass: 'processing-mode', innerHTML: this.SVG_ICONS.RECORD },
    [StatusType.LISTENING]: { code: StatusType.LISTENING, text: 'Listening...', buttonMode: ButtonMode.STOP, icon: 'hearing', cssClass: 'listening-mode', dataAction: ButtonMode.STOP, innerHTML: this.SVG_ICONS.STOP }
  };

  constructor(
    private readonly eventBus: EventBus,
    private readonly status: Status
  ) {
    this.eventBus.on(SpeechEvents.TRANSCRIPTION_COMPLETED, this.onTranscriptionCompleted.bind(this));
    this.eventBus.on(SpeechEvents.ERROR_OCCURRED, this.onError.bind(this));
    this.eventBus.on(SpeechEvents.RECORD_BUTTON_PRESSED, this.onNewRecording.bind(this));
    this.eventBus.on(SpeechEvents.LISTEN_STARTED, this.onNewRecording.bind(this));
  }
  
  private onNewRecording(): void {
    this.fadeTranscription();
  }

  public async init(config: UIConfig): Promise<void> {
    this.config = config;
    const widgetId = this.config.widgetId;
    this.widget = widgetId ? document.getElementById(widgetId) : null;
    this.widget ??= await this.createDefaultUI(widgetId!);
    this.updateUIStatus();
  }

  private async createDefaultUI(widgetId: string): Promise<HTMLElement> { 
    this.widget = this.createWidget(widgetId);
    // Use optional chaining to safely pass potentially undefined config values
    await this.setUI(this.config?.position, this.config?.width, this.config?.height);
    return this.widget;
  }

  // --- START: MODIFICATION ---
  // 4. Make parameters optional and provide sensible defaults.
  //    This fixes the "undefined must be a string" errors from your logs.
  private async setUI(position?: string, width?: string, height?: string): Promise<void> {
    if (!this.widget) return;

    // Define defaults to make the component robust
    const finalPosition = position ?? 'bottom-right';
    const finalWidth = width ?? '350px';
    const finalHeight = height ?? 'auto';

    this.widget.classList.add('voice-recorder-widget', `voice-${finalPosition}`);
    this.widget.style.width = finalWidth;
    this.widget.style.height = finalHeight;

    // The methods below will now use the bundled assets.
    await this.createUIElements();
    await this.injectStyles(this.widget, this.config?.styleUrl, this.config?.styles);
  }
  // --- END: MODIFICATION ---

  private createWidget(id: string): HTMLElement {
    const widget = document.createElement('div');
    widget.id = id;
    // Safely access config
    if (this.config) {
      this.config.widgetId = id;
    }
    document.body.appendChild(widget);
    return widget;
  }
  
  // --- START: MODIFICATION ---
  // 5. This method now uses the imported 'defaultStyles' variable.
  //    It no longer fetches any internal assets at runtime.
  private async injectStyles(widget: any, fileStyles: string | undefined, inlineStyles: any): Promise<void> {
    if (document.getElementById(this.STYLE_ELEMENT_ID)) return;

    const styleElement = document.createElement('style');
    styleElement.id = this.STYLE_ELEMENT_ID;
    
    // Use the CSS content imported at build time
    const cssContent = defaultStyles;

    // Append dynamic animation styles
    const customAnimationStyles = `
    .action-button.recording-mode { background-color: #dc3545 !important; border-color: #dc3545 !important; color: white !important; }
    .action-button.recording-mode:hover { background-color: #c82333 !important; border-color: #bd2130 !important; }
    .button-widget.listening .action-button { position: relative; overflow: visible; }
    .button-widget.listening .action-button::before { 
      content: ''; 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      width: 100%; 
      height: 100%; 
      border: 2px solid #007bff; 
      border-radius: 50%; 
      transform: translate(-50%, -50%); 
      animation: wave-pulse 2s infinite; 
      opacity: 0.6; 
      pointer-events: none; /* <-- ADD THIS LINE */
    }
    @keyframes wave-pulse { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; } 50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; } 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; } }
  `;
  styleElement.textContent = cssContent + customAnimationStyles;
  document.head.appendChild(styleElement);

    // The logic for user-provided styles can remain, but it should not handle internal files.
    // The finalizeStyles, parse, toCamelCase, and mergeStyles methods can likely be removed
    // unless you need to support a user-provided `styleUrl`.
    Object.assign(widget.style, inlineStyles || {});
  }
  // --- END: MODIFICATION ---

  // NOTE: The `finalizeStyles` and related methods are now likely obsolete unless
  // you intend for users to provide a URL to their own stylesheet.
  // If not, you can safely delete `finalizeStyles`, `parse`, `toCamelCase`, and `mergeStyles`.
  async finalizeStyles(fileStyles: string | undefined, inlineStyles: any) {
    // This logic would now only apply to user-provided URLs.
    if (fileStyles) {
      // Consider using a public fetch function if needed, not an internal one.
      // const cssContent = await fetchContent(fileStyles);
      // const cssProperties = this.parse(cssContent);
      // ...
    }
    return inlineStyles || {};
  }
  private parse(cssContent: string): Record<string, string> { /* ... */ return {}; }
  private toCamelCase(cssProperties: Record<string, string>): Record<string, string> { /* ... */ return {}; }
  mergeStyles(primaryStyles: any, secondaryStyles: any) { /* ... */ return {}; }

  // --- START: MODIFICATION ---
  // 6. This method now uses the imported 'htmlTemplate' variable.
  private async createUIElements(): Promise<void> {
    if (!this.widget) return;
    this.widget.innerHTML = '';  

    // No try/catch needed for fetching. The HTML is guaranteed to be here.
    this.widget.innerHTML = htmlTemplate;
    
    this.actionButton = this.widget.querySelector(this.ACTION_BUTTON_SELECTOR);
    this.buttonWidget = this.widget.querySelector(this.BUTTON_WIDGET_SELECTOR);
    this.statusDisplay = this.widget.querySelector(this.STATUS_DISPLAY_SELECTOR);
    this.transcriptionDisplay = this.widget.querySelector(this.TRANSCRIPTION_DISPLAY_SELECTOR);
    
    this.logger.info('UI Elements found:', { actionButton: !!this.actionButton, buttonWidget: !!this.buttonWidget, statusDisplay: !!this.statusDisplay, transcriptionDisplay: !!this.transcriptionDisplay });
    
    if (this.actionButton) {
      this.bindEventListeners();
    }
    this.syncTranscriptionDisplay();
  }
  // --- END: MODIFICATION ---

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
    if (!this.widget) return;
    const status = this.status.get().value;
    this.showStatus(status);
    this.setActionButton(status);
    this.setButtonAnimation(status);
    this.syncTranscriptionDisplay();
  }

  public setTranscription(transcription: string): void {
    this.logger.info('Setting transcription:', transcription);
    this.transcription = transcription;
    this.syncTranscriptionDisplay();
  }

  private onTranscriptionCompleted(transcription: string): void {
    this.logger.info('Transcription completed:', transcription);
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
        case ErrorType.MICROPHONE_ACCESS: return 'Please allow microphone access';
        case ErrorType.NETWORK: return 'Network connection issue';
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

  private setButtonAnimation(status: StatusType): void {
    if (!this.buttonWidget) return;
    this.buttonWidget.classList.remove('listening', 'recording');
    switch (status) {
      case StatusType.LISTENING: this.buttonWidget.classList.add('listening'); break;
      case StatusType.RECORDING: this.buttonWidget.classList.add('recording'); break;
    }
  }

  private syncTranscriptionDisplay(): void {
    if (!this.transcriptionDisplay) {
      this.logger.warn('Transcription display element not found');
      return;
    }
    const trimmed = this.transcription?.trim() ?? '';
    const hasContent = trimmed.length > 0;
    if (hasContent) {
      this.transcriptionDisplay.textContent = trimmed;
      this.transcriptionDisplay.style.display = 'block';
      this.restoreTranscriptionOpacity();
      this.expandWidget();
    } else {
      this.transcriptionDisplay.textContent = '';
      this.transcriptionDisplay.style.display = 'none';
      this.resetWidgetSize();
    }
  }

  private fadeTranscription(): void {
    if (!this.transcriptionDisplay) return;
    if (this.transcriptionDisplay.textContent && this.transcriptionDisplay.textContent.trim().length > 0) {
      this.transcriptionDisplay.style.opacity = '0.4';
      this.transcriptionDisplay.style.transition = 'opacity 0.3s ease';
    }
  }

  private restoreTranscriptionOpacity(): void {
    if (!this.transcriptionDisplay) return;
    this.transcriptionDisplay.style.opacity = '1';
    this.transcriptionDisplay.style.transition = 'opacity 0.3s ease';
  }

  private expandWidget(): void {
    if (!this.widget) return;
    this.widget.style.maxHeight = '200px'; // Allow more room
    this.widget.style.height = 'auto';
  }

  private resetWidgetSize(): void {
    if (!this.widget) return;
    this.widget.style.maxHeight = '75px';
    this.widget.style.height = 'auto';
  }
  
  private showError(message: string): void {
    if (!this.statusDisplay) return;
    this.statusDisplay.textContent = message;
    this.statusDisplay.classList.add('error-state');
  }

  public debugTranscription(text: string): void {
    this.logger.info('Debug: Setting test transcription');
    this.setTranscription(text);
  }
}