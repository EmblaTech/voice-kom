export class SpeechAdapter {
    private _containerId: string;
    private _lang: string;
    private _speechEngine: string;
    private _speechApiKey: string;
    private _speechConfidence: number;
    private _speechEngineParams: Record<string, any>;    
    // UI options with defaults
    private _autoStart: boolean;
    private _position: string;
    private _width: number | string;
    private _height: number | string;
    private _theme: string;
    private _styles: Record<string, string>;

    //Constants
    static readonly defaultContainerId = 'speech-container';
    static readonly defaultConfidence = 0.8;
    static readonly defaultPosition ='bottom-right';
    static readonly defaultWidth = '300px';
    static readonly defaultHeight = '400px';
    static readonly defaultTheme = 'light';
    static readonly supportedEngines = ['default', 'openai', 'google', 'azure'];
    static readonly supportedLangs = ['en', 'no', 'ta', 'si'];

    constructor(options: AdapterOptions) {
        this._containerId = options.containerId ?? SpeechAdapter.defaultContainerId;
        this._lang = options.lang ?? 'en';
        this._speechEngine = options.speechEngine ?? 'default';
        
        // Set optional speech-to-text properties with defaults
        this._speechApiKey = options.speechApiKey ?? '';
        this._speechConfidence = options.speechConfidence ?? 0.8;
        this._speechEngineParams = options.speechEngineParams || {};
        
        // Set UI options with defaults
        this._autoStart = options.autoStart ?? false;
        this._position = options.position ?? SpeechAdapter.defaultPosition;
        this._width = options.width ?? SpeechAdapter.defaultWidth;
        this._height = options.height ?? SpeechAdapter.defaultHeight;
        this._theme = options.theme ?? SpeechAdapter.defaultTheme;
        this._styles = options.styles || {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            buttonColor: '#4285f4',
            buttonTextColor: '#ffffff'
        };
        console.log("SpeechAdapter initialized", this);
    }
    
    renderUI() {        
        if(!this._containerId) { //If container is empty, then inject default container into the DOM
            this.createDefaultUI();
            console.log("Default UI container created");
        }
        else{
            this.setUI(this._position, this._width, this._height, this._styles);
            console.log("Set container with these options", this._position, this._width, this._height, this._styles);
        }
    }

    start():void {
        console.log("Listening started");
    }

    stop():void {
        console.log("Listening stopped");
    }

    set containerId(value: string) {
        this._containerId = value;
    }

    get containerId(): string {
        return this._containerId;
    }   

    set lang(value: string) {
        if (!SpeechAdapter.supportedLangs.includes(value)) {
            console.warn(`Language '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedLangs.join(', ')}`);
        }
        this._lang = value;
    }

    get lang(): string {
        return this._lang;
    }

    set speechEngine(value: string) {
        if (!SpeechAdapter.supportedEngines.includes(value)) {
            console.warn(`Speech engine '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedEngines.join(', ')}`);
        }
        this._speechEngine = value;
    }    

    get speechEngine(): string {
        return this._speechEngine;
    }
   
    set speechApiKey(value: string) {
        this._speechApiKey = value;
    }

    get speechApiKey(): string {
        return this._speechApiKey;
    }

    set speechConfidence(value: number) {
        if (value < 0 || value > 1) {
            console.warn(`Confidence value '${value}' is out of range. It should be between 0 and 1.`);
        }
        this._speechConfidence = value;
    }

    get speechConfidence(): number {
        return this._speechConfidence;
    }

    set speechEngineParams(value: Record<string, any>) {
        this._speechEngineParams = value;
    }

    get speechEngineParams(): Record<string, any> {
        return this._speechEngineParams;
    }

    set autoStart(value: boolean) {
        this._autoStart = value;
    }
    get autoStart(): boolean {
        return this._autoStart;
    }

    set width(width: number | string) {
        const container = document.getElementById(this._containerId);
        if (container) {
            container.style.width = typeof width === 'number' ? `${width}px` : width;
            this._width = width
        }
    }

    get width(): number | string {
        return this._width;
    }

    set height(height: number | string) {
        const container = document.getElementById(this._containerId);
        if (container) {
            container.style.height = typeof height === 'number' ? `${height}px` : height;
            this._height = height
        }
    }

    get height(): number | string {
        return this._height;
    }
    
    set position(position: string) {
        const container = document.getElementById(this._containerId);
        if (container) {
            switch (position) {
                case 'bottom-right':
                    container.style.bottom = '10px';
                    container.style.right = '10px';
                    break;
                case 'bottom-left':
                    container.style.bottom = '10px';
                    container.style.left = '10px';
                    break;
                case 'top-right':
                    container.style.top = '10px';
                    container.style.right = '10px';
                    break;
                case 'top-left':
                    container.style.top = '10px';
                    container.style.left = '10px';
                    break;
                case 'center':
                    container.style.top = '50%';
                    container.style.left = '50%';
                    container.style.transform = 'translate(-50%, -50%)';
                    break;
                default:
                    console.warn('Invalid position specified. Defaulting to bottom-right.');
            }
            this._position = position;
        }
    }

    get position(): string {
        return this._position;
    }
    
    set customStyles(styles: Record<string, any>) {
        const container = document.getElementById(this._containerId);
        if (container) {
            Object.keys(styles).forEach((key) => {
                container.style[key as any] = styles[key];
            });
            this._styles = styles
        }
    }

    get customStyles(): Record<string, any> {
        return this._styles;
    }

    set theme(theme: string){
        const container = document.getElementById(this._containerId);
        if (container) {
            switch (theme) {
                case 'light':
                    container.style.backgroundColor = '#ffffff';
                    container.style.color = '#000000';
                    break;
                case 'dark':
                    container.style.backgroundColor = '#000000';
                    container.style.color = '#ffffff';
                    break;
                case 'custom':
                    // Apply custom styles if any
                    break;
                default:
                    console.warn('Invalid theme specified. Defaulting to light.');
            }
            this._theme = theme
        }   
    }

    get theme(): string {
        return this._theme;
    }
    
    private createDefaultUI() {
        // TODO: Create default container to support speech, change accordingly
        const container = document.createElement('div');
        container.id = SpeechAdapter.defaultContainerId;
        //Inject div into DOM
        this.setUI(SpeechAdapter.defaultPosition, SpeechAdapter.defaultWidth, SpeechAdapter.defaultHeight, {});
        this.theme = this._theme ?? SpeechAdapter.defaultTheme;
    }

    private setUI(position: string, width: number | string, height: number | string, styles: Record<string, string>) {
        // TODO: Set the given styles , UI options and set the speech container
        this.position = position ?? SpeechAdapter.defaultPosition;
        this.width = width ?? SpeechAdapter.defaultWidth;  
        this.height = height ?? SpeechAdapter.defaultHeight;   
        this.customStyles = styles || {};
    }
}

export default SpeechAdapter;