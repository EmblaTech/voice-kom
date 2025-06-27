// Enhanced Recording status enum with WAITING state
export enum StatusType {
  IDLE = 'idle',
  WAITING = 'waiting', // New state for when we're waiting for speech in listening mode
  RECORDING = 'recording',
  PROCESSING = 'processing',
  EXECUTING = 'executing',
  ERROR = 'error'
}

export enum ErrorType {
  MICROPHONE_ACCESS = 'microphone_access_error',
  TRANSCRIPTION = 'transcription_error',
  NETWORK = 'network_error',
  UNKNOWN = 'unknown_error'
}

export enum ButtonMode {
  RECORD = 'record',
  STOP = 'stop',
  PROCESSING = 'processing'
}

export interface StatusMeta {
  code: StatusType;        
  text: string;           
  buttonMode: ButtonMode; 
  icon: string;
  cssClass: string;
  dataAction?: string;
  innerHTML: string;
}

export class Status {
  private currentStatus: StatusType;
  private message?: string;

  constructor() {
    this.currentStatus = StatusType.IDLE;
    this.message = "";
  }
  
  // Get current state (immutable)
  public get(): Readonly<any> {
    return { 
        value: this.currentStatus,
        message: this.message
     };
  }
  
  // Set recording status
  public set(status: StatusType, message?: string): void {
    this.currentStatus = status;
    this.message = message;
  }
  
  // Reset state
  public reset(): void {
    this.set(StatusType.IDLE, "");
  }
}