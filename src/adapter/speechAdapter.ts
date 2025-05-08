import { SpeechCore } from "../core/speechCore";
import { Logger } from "../util/logger";

export class SpeechAdapter {
    private _containerId: string;
    private _lang: string;

    // Speech to text engine options
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

    private _core: SpeechCore;
    //Constants
    static readonly defaultContainerId = 'speech-container';
    static readonly defaultConfidence = 0.8;
    static readonly defaultPosition ='bottom-right';
    static readonly defaultWidth = '300px';
    static readonly defaultHeight = '400px';
    static readonly defaultTheme = 'light';
    static readonly defaultSpeechEngine = 'default';
    static readonly defaultLang = 'en';
    static readonly supportedEngines = ['default', 'openai', 'google', 'azure'];
    static readonly supportedLangs = ['en', 'no', 'ta', 'si'];

    private readonly logger = Logger.getInstance();

    async init(config: AdapterConfig) { 
        this._containerId = config.containerId ?? SpeechAdapter.defaultContainerId;
        this._lang = config.lang ?? SpeechAdapter.defaultLang;
        this._speechEngine = config.speechEngine ?? SpeechAdapter.defaultSpeechEngine;
        
        // Set optional speech-to-text properties with defaults
        this._speechApiKey = config.speechApiKey ?? '';
        this._speechConfidence = config.speechConfidence ?? SpeechAdapter.defaultConfidence;
        this._speechEngineParams = config.speechEngineParams || {};
        
        // Set UI options with defaults
        this._autoStart = config.autoStart ?? false;
        this._position = config.position ?? SpeechAdapter.defaultPosition;
        this._width = config.width ?? SpeechAdapter.defaultWidth;
        this._height = config.height ?? SpeechAdapter.defaultHeight;
        this._theme = config.theme ?? SpeechAdapter.defaultTheme;
        this._styles = config.styles || {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            buttonColor: '#4285f4',
            buttonTextColor: '#ffffff'
        };      
        //Initialize core manager 
        this._core = new SpeechCore();
        await this._core.init({
            lang: this._lang, 
            engineConfig: { 
                            name: this._speechEngine, 
                            confidence: this._speechConfidence,
                            params: this._speechEngineParams 
                        }
                    });
        this.logger.info("SpeechAdapter initialised with config", config);
    }
    
    renderUI() {        
        if(!this._containerId) { //If container is empty, then inject default container into the DOM
            this._createDefaultUI();
            this.logger.info("Default UI container created");
        }
        else{
            this._setUI(this._position, this._width, this._height, this._styles);
            this.logger.info("Set container with these options", this._position, this._width, this._height, this._styles);
        }
    }

    async start() {
        this.logger.info("SpeechAdapter recording started");
        this._core.startRecording();
    }

    async stop() {
        this.logger.info("SpeechAdapter recording stopped");
        this._core.stopRecording();
    }

    setContainerId(value: string){
        this._containerId = value;
    }

    get containerId(): string {
        return this._containerId;
    }   

    setLang(value: string) {
        if (!SpeechAdapter.supportedLangs.includes(value)) {
            this.logger.warn(`Language '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedLangs.join(', ')}`);
        }
        this._lang = value;
    }

    get lang(): string {
        return this._lang;
    }

    setSpeechEngine(value: string) {
        if (!SpeechAdapter.supportedEngines.includes(value)) {
            this.logger.warn(`Speech engine '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedEngines.join(', ')}`);
        }
        this._speechEngine = value;
    }    

    get speechEngine(): string {
        return this._speechEngine;
    }
   
    setSpeechApiKey(value: string) {
        this._speechApiKey = value;
    }

    get speechApiKey(): string {
        return this._speechApiKey;
    }

    setSpeechConfidence(value: number) {
        if (value < 0 || value > 1) {
            this.logger.warn(`Confidence value '${value}' is out of range. It should be between 0 and 1.`);
        }
        this._speechConfidence = value;
    }

    get speechConfidence(): number {
        return this._speechConfidence;
    }

    setSpeechEngineParams(value: Record<string, any>) {
        this._speechEngineParams = value;
    }

    get speechEngineParams(): Record<string, any> {
        return this._speechEngineParams;
    }

    setAutoStart(value: boolean) {
        this._autoStart = value;
    }
    get autoStart(): boolean {
        return this._autoStart;
    }

    setWidth(width: number | string) {
        const container = document.getElementById(this._containerId);
        if (container) {
            container.style.width = typeof width === 'number' ? `${width}px` : width;
            this._width = width
        }
    }

    get width(): number | string {
        return this._width;
    }

    setHeight(height: number | string) {
        const container = document.getElementById(this._containerId);
        if (container) {
            container.style.height = typeof height === 'number' ? `${height}px` : height;
            this._height = height
        }
    }

    get height(): number | string {
        return this._height;
    }
    
    setPosition(position: string) {
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
    
    setCustomStyles(styles: Record<string, any>) {
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

    setTheme(theme: string){
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

    private _createDefaultUI() {
        // TODO: Create default container to support speech, change accordingly
        const container = document.createElement('div');
        container.id = SpeechAdapter.defaultContainerId;
        //Inject div into DOM
        this._setUI(SpeechAdapter.defaultPosition, SpeechAdapter.defaultWidth, SpeechAdapter.defaultHeight, {});
        this.setTheme(this._theme ?? SpeechAdapter.defaultTheme);
    }

    private _setUI(position: string, width: number | string, height: number | string, styles: Record<string, string>) {
        // TODO: Set the given styles , UI options and set the speech container
        this.setPosition(position ?? SpeechAdapter.defaultPosition);
        this.setWidth(width ?? SpeechAdapter.defaultWidth);  
        this.setHeight(height ?? SpeechAdapter.defaultHeight);   
        this.setCustomStyles(styles || {});
    }
}