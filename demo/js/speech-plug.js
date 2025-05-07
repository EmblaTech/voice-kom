/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ var __webpack_modules__ = ({

/***/ "./src/adapter/speechAdapter.ts":
/*!**************************************!*\
  !*** ./src/adapter/speechAdapter.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SpeechAdapter: () => (/* binding */ SpeechAdapter)\n/* harmony export */ });\n/* harmony import */ var _core_coreManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/coreManager */ \"./src/core/coreManager.ts\");\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n\n\nclass SpeechAdapter {\n    constructor() {\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.getInstance();\n    }\n    async init(config) {\n        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;\n        this._containerId = (_a = config.containerId) !== null && _a !== void 0 ? _a : SpeechAdapter.defaultContainerId;\n        this._lang = (_b = config.lang) !== null && _b !== void 0 ? _b : SpeechAdapter.defaultLang;\n        this._speechEngine = (_c = config.speechEngine) !== null && _c !== void 0 ? _c : SpeechAdapter.defaultSpeechEngine;\n        // Set optional speech-to-text properties with defaults\n        this._speechApiKey = (_d = config.speechApiKey) !== null && _d !== void 0 ? _d : '';\n        this._speechConfidence = (_e = config.speechConfidence) !== null && _e !== void 0 ? _e : SpeechAdapter.defaultConfidence;\n        this._speechEngineParams = config.speechEngineParams || {};\n        // Set UI options with defaults\n        this._autoStart = (_f = config.autoStart) !== null && _f !== void 0 ? _f : false;\n        this._position = (_g = config.position) !== null && _g !== void 0 ? _g : SpeechAdapter.defaultPosition;\n        this._width = (_h = config.width) !== null && _h !== void 0 ? _h : SpeechAdapter.defaultWidth;\n        this._height = (_j = config.height) !== null && _j !== void 0 ? _j : SpeechAdapter.defaultHeight;\n        this._theme = (_k = config.theme) !== null && _k !== void 0 ? _k : SpeechAdapter.defaultTheme;\n        this._styles = config.styles || {\n            backgroundColor: '#ffffff',\n            textColor: '#333333',\n            buttonColor: '#4285f4',\n            buttonTextColor: '#ffffff'\n        };\n        //Initialize core manager \n        this._coreManager = new _core_coreManager__WEBPACK_IMPORTED_MODULE_0__.CoreManager();\n        await this._coreManager.init({\n            lang: this._lang,\n            engineConfig: {\n                name: this._speechEngine,\n                confidence: this._speechConfidence,\n                params: this._speechEngineParams\n            }\n        });\n        this.logger.info(\"SpeechAdapter initialised with config\", config);\n    }\n    renderUI() {\n        if (!this._containerId) { //If container is empty, then inject default container into the DOM\n            this._createDefaultUI();\n            this.logger.info(\"Default UI container created\");\n        }\n        else {\n            this._setUI(this._position, this._width, this._height, this._styles);\n            this.logger.info(\"Set container with these options\", this._position, this._width, this._height, this._styles);\n        }\n    }\n    async start() {\n        this.logger.info(\"SpeechAdapter recording started\");\n        this._coreManager.startRecording();\n    }\n    async stop() {\n        this.logger.info(\"SpeechAdapter recording stopped\");\n        this._coreManager.stopRecording();\n    }\n    setContainerId(value) {\n        this._containerId = value;\n    }\n    get containerId() {\n        return this._containerId;\n    }\n    setLang(value) {\n        if (!SpeechAdapter.supportedLangs.includes(value)) {\n            this.logger.warn(`Language '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedLangs.join(', ')}`);\n        }\n        this._lang = value;\n    }\n    get lang() {\n        return this._lang;\n    }\n    setSpeechEngine(value) {\n        if (!SpeechAdapter.supportedEngines.includes(value)) {\n            this.logger.warn(`Speech engine '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedEngines.join(', ')}`);\n        }\n        this._speechEngine = value;\n    }\n    get speechEngine() {\n        return this._speechEngine;\n    }\n    setSpeechApiKey(value) {\n        this._speechApiKey = value;\n    }\n    get speechApiKey() {\n        return this._speechApiKey;\n    }\n    setSpeechConfidence(value) {\n        if (value < 0 || value > 1) {\n            this.logger.warn(`Confidence value '${value}' is out of range. It should be between 0 and 1.`);\n        }\n        this._speechConfidence = value;\n    }\n    get speechConfidence() {\n        return this._speechConfidence;\n    }\n    setSpeechEngineParams(value) {\n        this._speechEngineParams = value;\n    }\n    get speechEngineParams() {\n        return this._speechEngineParams;\n    }\n    setAutoStart(value) {\n        this._autoStart = value;\n    }\n    get autoStart() {\n        return this._autoStart;\n    }\n    setWidth(width) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            container.style.width = typeof width === 'number' ? `${width}px` : width;\n            this._width = width;\n        }\n    }\n    get width() {\n        return this._width;\n    }\n    setHeight(height) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            container.style.height = typeof height === 'number' ? `${height}px` : height;\n            this._height = height;\n        }\n    }\n    get height() {\n        return this._height;\n    }\n    setPosition(position) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            switch (position) {\n                case 'bottom-right':\n                    container.style.bottom = '10px';\n                    container.style.right = '10px';\n                    break;\n                case 'bottom-left':\n                    container.style.bottom = '10px';\n                    container.style.left = '10px';\n                    break;\n                case 'top-right':\n                    container.style.top = '10px';\n                    container.style.right = '10px';\n                    break;\n                case 'top-left':\n                    container.style.top = '10px';\n                    container.style.left = '10px';\n                    break;\n                case 'center':\n                    container.style.top = '50%';\n                    container.style.left = '50%';\n                    container.style.transform = 'translate(-50%, -50%)';\n                    break;\n                default:\n                    console.warn('Invalid position specified. Defaulting to bottom-right.');\n            }\n            this._position = position;\n        }\n    }\n    get position() {\n        return this._position;\n    }\n    setCustomStyles(styles) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            Object.keys(styles).forEach((key) => {\n                container.style[key] = styles[key];\n            });\n            this._styles = styles;\n        }\n    }\n    get customStyles() {\n        return this._styles;\n    }\n    setTheme(theme) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            switch (theme) {\n                case 'light':\n                    container.style.backgroundColor = '#ffffff';\n                    container.style.color = '#000000';\n                    break;\n                case 'dark':\n                    container.style.backgroundColor = '#000000';\n                    container.style.color = '#ffffff';\n                    break;\n                case 'custom':\n                    // Apply custom styles if any\n                    break;\n                default:\n                    console.warn('Invalid theme specified. Defaulting to light.');\n            }\n            this._theme = theme;\n        }\n    }\n    get theme() {\n        return this._theme;\n    }\n    _createDefaultUI() {\n        var _a;\n        // TODO: Create default container to support speech, change accordingly\n        const container = document.createElement('div');\n        container.id = SpeechAdapter.defaultContainerId;\n        //Inject div into DOM\n        this._setUI(SpeechAdapter.defaultPosition, SpeechAdapter.defaultWidth, SpeechAdapter.defaultHeight, {});\n        this.setTheme((_a = this._theme) !== null && _a !== void 0 ? _a : SpeechAdapter.defaultTheme);\n    }\n    _setUI(position, width, height, styles) {\n        // TODO: Set the given styles , UI options and set the speech container\n        this.setPosition(position !== null && position !== void 0 ? position : SpeechAdapter.defaultPosition);\n        this.setWidth(width !== null && width !== void 0 ? width : SpeechAdapter.defaultWidth);\n        this.setHeight(height !== null && height !== void 0 ? height : SpeechAdapter.defaultHeight);\n        this.setCustomStyles(styles || {});\n    }\n}\n//Constants\nSpeechAdapter.defaultContainerId = 'speech-container';\nSpeechAdapter.defaultConfidence = 0.8;\nSpeechAdapter.defaultPosition = 'bottom-right';\nSpeechAdapter.defaultWidth = '300px';\nSpeechAdapter.defaultHeight = '400px';\nSpeechAdapter.defaultTheme = 'light';\nSpeechAdapter.defaultSpeechEngine = 'default';\nSpeechAdapter.defaultLang = 'en';\nSpeechAdapter.supportedEngines = ['default', 'openai', 'google', 'azure'];\nSpeechAdapter.supportedLangs = ['en', 'no', 'ta', 'si'];\n\n\n//# sourceURL=webpack://speech-plug/./src/adapter/speechAdapter.ts?");

/***/ }),

/***/ "./src/core/coreManager.ts":
/*!*********************************!*\
  !*** ./src/core/coreManager.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CoreManager: () => (/* binding */ CoreManager)\n/* harmony export */ });\n/* harmony import */ var _nlu_nlpModule__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../nlu/nlpModule */ \"./src/nlu/nlpModule.ts\");\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n\n\nclass CoreManager {\n    constructor() {\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.getInstance();\n    }\n    async init(config) {\n        this._lang = config.lang;\n        this._nlpModule = new _nlu_nlpModule__WEBPACK_IMPORTED_MODULE_0__.NLPModule();\n        this._nlpModule.init({});\n        this.logger.info(\"Core initialized with config\", config);\n    }\n    async startRecording() {\n        this.logger.info(\"Core recording started\");\n        await this._nlpModule.startRecording();\n    }\n    async stopRecording() {\n        this.logger.info(\"Core recording stopped\");\n        await this._nlpModule.stopRecording()\n            .then((result) => {\n            this.logger.info(\"Core::Successfully processed audio\", result);\n        })\n            .catch((error) => {\n            this.logger.error(\"Core::There's an error while processing\", error);\n        });\n    }\n    setLang(value) {\n        this._lang = value;\n        this.logger.info(\"Language set to:\", value);\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/core/coreManager.ts?");

/***/ }),

/***/ "./src/nlu/audioRecorder.ts":
/*!**********************************!*\
  !*** ./src/nlu/audioRecorder.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AudioRecorder: () => (/* binding */ AudioRecorder)\n/* harmony export */ });\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n\nclass AudioRecorder {\n    constructor() {\n        this.mediaRecorder = null;\n        this.audioChunks = [];\n        this.resolveAudioPromise = null;\n        this.rejectAudioPromise = null;\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.getInstance();\n    }\n    //TODO: Change this as promise\n    startRecording() {\n        this.logger.info(\"AudioRecorder recording started\");\n        navigator.mediaDevices.getUserMedia({ audio: true })\n            .then(stream => {\n            this.audioChunks = [];\n            this.mediaRecorder = new MediaRecorder(stream);\n            this.mediaRecorder.addEventListener('dataavailable', (event) => {\n                if (event.data.size > 0) {\n                    this.audioChunks.push(event.data);\n                }\n            });\n            this.mediaRecorder.addEventListener('stop', () => {\n                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });\n                // Resolve the promise with the recorded audio blob\n                if (this.resolveAudioPromise) {\n                    this.resolveAudioPromise(audioBlob);\n                }\n                // Stop all tracks in the stream to release the microphone\n                stream.getTracks().forEach(track => track.stop());\n            });\n            this.mediaRecorder.start();\n        })\n            .catch((error) => {\n            this.logger.error('Error accessing microphone:', error);\n            if (this.rejectAudioPromise) {\n                this.rejectAudioPromise(error);\n            }\n        });\n    }\n    //TODO: Change this resolve without resolveAudioPromise\n    stopRecording() {\n        this.logger.info(\"AudioRecorder recording stopped\");\n        return new Promise((resolve, reject) => {\n            this.resolveAudioPromise = resolve;\n            this.rejectAudioPromise = reject;\n            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {\n                this.mediaRecorder.stop();\n            }\n            else {\n                reject(new Error(\"MediaRecorder not available or already stopped\"));\n            }\n        });\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/nlu/audioRecorder.ts?");

/***/ }),

/***/ "./src/nlu/defaultSpeechEngine.ts":
/*!****************************************!*\
  !*** ./src/nlu/defaultSpeechEngine.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DefaultSpeechEngine: () => (/* binding */ DefaultSpeechEngine)\n/* harmony export */ });\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n\nclass DefaultSpeechEngine {\n    constructor(config) {\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.getInstance();\n        this.config = config;\n    }\n    transcribe(rawAudio) {\n        this.logger.info('DefaultSpeechEngine: Transcribing audio...');\n        // Implementation would depend on what transcription service we're using\n        // This could be local or cloud service\n        return Promise.resolve('sample transcription'); // Replace with actual implementation\n    }\n    detectIntent(transcription) {\n        this.logger.info('DefaultSpeechEngine: Detecting intent from:', transcription);\n        // Simple intent detection logic\n        // In a real implementation, this would connect to an NLU service\n        return Promise.resolve({\n            intent: 'sample_intent',\n            confidence: 0.85\n        });\n    }\n    extractEntities(transcription, intent) {\n        this.logger.info('DefaultSpeechEngine: Extracting entities for intent:', intent);\n        // Entity extraction logic\n        // In a real implementation, this would use NER models or services\n        return Promise.resolve([\n            {\n                type: 'sample_entity_1',\n                value: 'sample_value_1',\n                confidence: 0.9\n            },\n            {\n                type: 'sample_entity_2',\n                value: 'sample_value_2',\n                confidence: 0.8\n            }\n        ]);\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/nlu/defaultSpeechEngine.ts?");

/***/ }),

/***/ "./src/nlu/llmSpeechEngine.ts":
/*!************************************!*\
  !*** ./src/nlu/llmSpeechEngine.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   LLMSpeechEngine: () => (/* binding */ LLMSpeechEngine)\n/* harmony export */ });\nclass LLMSpeechEngine {\n    constructor(config) {\n        this.config = config;\n    }\n    transcribe(rawAudio) {\n        throw new Error(\"Method not implemented.\");\n    }\n    detectIntent(transcription) {\n        throw new Error(\"Method not implemented.\");\n    }\n    extractEntities(transcription, intent) {\n        throw new Error(\"Method not implemented.\");\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/nlu/llmSpeechEngine.ts?");

/***/ }),

/***/ "./src/nlu/nlpModule.ts":
/*!******************************!*\
  !*** ./src/nlu/nlpModule.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   NLPModule: () => (/* binding */ NLPModule)\n/* harmony export */ });\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n/* harmony import */ var _audioRecorder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./audioRecorder */ \"./src/nlu/audioRecorder.ts\");\n/* harmony import */ var _speechManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./speechManager */ \"./src/nlu/speechManager.ts\");\n\n\n\nclass NLPModule {\n    constructor() {\n        this.isRecording = false;\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.getInstance();\n    }\n    async init(config) {\n        this.audioRecorder = new _audioRecorder__WEBPACK_IMPORTED_MODULE_1__.AudioRecorder();\n        this.speechManager = new _speechManager__WEBPACK_IMPORTED_MODULE_2__.SpeechManager();\n        this.speechManager.init({});\n        this.logger.info(\"NLPModule initialized with config\", config);\n    }\n    async startRecording() {\n        if (this.isRecording)\n            return;\n        this.logger.info(\"NLP recording started\");\n        this.audioRecorder.startRecording();\n        this.isRecording = true;\n    }\n    async stopRecording() {\n        if (!this.isRecording) {\n            throw new Error('NLUModule: No active recording to stop');\n        }\n        this.logger.info(\"NLP recording stopped\");\n        return new Promise((resolve, reject) => {\n            this.audioRecorder.stopRecording()\n                .then((rawAudio) => {\n                this.isRecording = false;\n                this.speechManager.processAudio(rawAudio)\n                    .then((result) => {\n                    this.logger.info(\"NLP::Successfully processed audio\", result);\n                    resolve(result);\n                })\n                    .catch((error) => {\n                    this.logger.info(\"NLP::Failed to process audio\", error);\n                    reject(new Error(\"Failed to process audio: \" + error.message));\n                });\n            })\n                .catch((error) => {\n                this.isRecording = false;\n                reject(new Error(\"Failed to stop recording: \" + error.message));\n            });\n        });\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/nlu/nlpModule.ts?");

/***/ }),

/***/ "./src/nlu/speechEngineFactory.ts":
/*!****************************************!*\
  !*** ./src/nlu/speechEngineFactory.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SpeechEngineFactory: () => (/* binding */ SpeechEngineFactory)\n/* harmony export */ });\n/* harmony import */ var _defaultSpeechEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultSpeechEngine */ \"./src/nlu/defaultSpeechEngine.ts\");\n/* harmony import */ var _llmSpeechEngine__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./llmSpeechEngine */ \"./src/nlu/llmSpeechEngine.ts\");\n\n\nclass SpeechEngineFactory {\n    static getEngine(type) {\n        switch (type) {\n            case \"default\":\n                let config = {\n                // Add any default configuration here\n                };\n                return new _defaultSpeechEngine__WEBPACK_IMPORTED_MODULE_0__.DefaultSpeechEngine(config);\n            case \"llm\":\n                let llmconfig = {\n                // Add any default configuration here\n                };\n                return new _llmSpeechEngine__WEBPACK_IMPORTED_MODULE_1__.LLMSpeechEngine(llmconfig);\n            default:\n                throw new Error(`Unsupported engine type: ${type}`);\n        }\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/nlu/speechEngineFactory.ts?");

/***/ }),

/***/ "./src/nlu/speechManager.ts":
/*!**********************************!*\
  !*** ./src/nlu/speechManager.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SpeechManager: () => (/* binding */ SpeechManager)\n/* harmony export */ });\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n/* harmony import */ var _speechEngineFactory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./speechEngineFactory */ \"./src/nlu/speechEngineFactory.ts\");\n\n\nclass SpeechManager {\n    constructor() {\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.getInstance();\n    }\n    async init(config) {\n        this.config = config;\n        this.speechEngine = _speechEngineFactory__WEBPACK_IMPORTED_MODULE_1__.SpeechEngineFactory.getEngine(\"default\");\n        this.logger.info(\"Speech manager initialized with config\", config);\n    }\n    setEngine(type) {\n        this.speechEngine = _speechEngineFactory__WEBPACK_IMPORTED_MODULE_1__.SpeechEngineFactory.getEngine(type);\n    }\n    async processAudio(rawAudio) {\n        try {\n            const transcription = await this.speechEngine.transcribe(rawAudio);\n            const intentResult = await this.speechEngine.detectIntent(transcription);\n            const entities = await this.speechEngine.extractEntities(transcription, intentResult.intent);\n            return {\n                intent: intentResult.intent,\n                confidence: intentResult.confidence,\n                entities: entities,\n                rawText: transcription,\n                alternatives: intentResult.alternatives\n            };\n        }\n        catch (error) {\n            throw new Error(`Error processing audio: ${error}`);\n        }\n    }\n}\n\n\n//# sourceURL=webpack://speech-plug/./src/nlu/speechManager.ts?");

/***/ }),

/***/ "./src/util/logger.ts":
/*!****************************!*\
  !*** ./src/util/logger.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   LogLevel: () => (/* binding */ LogLevel),\n/* harmony export */   Logger: () => (/* binding */ Logger),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\nvar LogLevel;\n(function (LogLevel) {\n    LogLevel[\"DEBUG\"] = \"DEBUG\";\n    LogLevel[\"INFO\"] = \"INFO\";\n    LogLevel[\"WARN\"] = \"WARN\";\n    LogLevel[\"ERROR\"] = \"ERROR\";\n})(LogLevel || (LogLevel = {}));\nclass Logger {\n    constructor() { }\n    static getInstance() {\n        if (!Logger.instance) {\n            Logger.instance = new Logger();\n        }\n        return Logger.instance;\n    }\n    debug(message, ...args) {\n        this.log(LogLevel.DEBUG, message, ...args);\n    }\n    info(message, ...args) {\n        this.log(LogLevel.INFO, message, ...args);\n    }\n    warn(message, ...args) {\n        this.log(LogLevel.WARN, message, ...args);\n    }\n    error(message, ...args) {\n        this.log(LogLevel.ERROR, message, ...args);\n    }\n    log(level, message, ...args) {\n        const timestamp = new Date().toISOString();\n        console.log(`[${timestamp}] [${level}] ${message}`, ...args);\n    }\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Logger);\n\n\n//# sourceURL=webpack://speech-plug/./src/util/logger.ts?");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module can't be inlined because the eval devtool is used.
/******/ var __webpack_exports__ = __webpack_require__("./src/adapter/speechAdapter.ts");
/******/ const __webpack_exports__SpeechAdapter = __webpack_exports__.SpeechAdapter;
/******/ export { __webpack_exports__SpeechAdapter as SpeechAdapter };
/******/ 
