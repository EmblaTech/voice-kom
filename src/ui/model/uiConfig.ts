export interface UIConfig {
    containerId?: string;
    autoStart?: boolean;
    position?: string;
    width?: string;
    height?: string;
    theme?: string;
    showProgress?: boolean;
    showTranscription?: boolean;
    styles?: Record<string, string>;
}

export const DEFAULT_UI_CONFIG: UIConfig = {
    containerId: 'speech-container',
    position: 'bottom-right',
    width: '300px',
    height: '400px',
    autoStart: false,
    showProgress: true,
    showTranscription: true
  };