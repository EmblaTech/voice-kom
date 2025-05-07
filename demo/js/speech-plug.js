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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SpeechAdapter: () => (/* binding */ SpeechAdapter),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _core_coreManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/coreManager */ \"./src/core/coreManager.ts\");\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n\n\nclass SpeechAdapter {\n    constructor(options) {\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_1__[\"default\"].getInstance();\n        this._init(options);\n        this.logger.info(\"SpeechAdapter initialized\", this);\n    }\n    renderUI() {\n        if (!this._containerId) { //If container is empty, then inject default container into the DOM\n            this._createDefaultUI();\n            this.logger.info(\"Default UI container created\");\n        }\n        else {\n            this._setUI(this._position, this._width, this._height, this._styles);\n            this.logger.info(\"Set container with these options\", this._position, this._width, this._height, this._styles);\n        }\n    }\n    start() {\n        this.logger.info(\"Listening started\");\n        this._core.start();\n    }\n    stop() {\n        this.logger.info(\"Listening stopped\");\n        this._core.stop();\n    }\n    setContainerId(value) {\n        this._containerId = value;\n    }\n    get containerId() {\n        return this._containerId;\n    }\n    setLang(value) {\n        if (!SpeechAdapter.supportedLangs.includes(value)) {\n            this.logger.warn(`Language '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedLangs.join(', ')}`);\n        }\n        this._lang = value;\n    }\n    get lang() {\n        return this._lang;\n    }\n    setSpeechEngine(value) {\n        if (!SpeechAdapter.supportedEngines.includes(value)) {\n            this.logger.warn(`Speech engine '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedEngines.join(', ')}`);\n        }\n        this._speechEngine = value;\n    }\n    get speechEngine() {\n        return this._speechEngine;\n    }\n    setSpeechApiKey(value) {\n        this._speechApiKey = value;\n    }\n    get speechApiKey() {\n        return this._speechApiKey;\n    }\n    setSpeechConfidence(value) {\n        if (value < 0 || value > 1) {\n            this.logger.warn(`Confidence value '${value}' is out of range. It should be between 0 and 1.`);\n        }\n        this._speechConfidence = value;\n    }\n    get speechConfidence() {\n        return this._speechConfidence;\n    }\n    setSpeechEngineParams(value) {\n        this._speechEngineParams = value;\n    }\n    get speechEngineParams() {\n        return this._speechEngineParams;\n    }\n    setAutoStart(value) {\n        this._autoStart = value;\n    }\n    get autoStart() {\n        return this._autoStart;\n    }\n    setWidth(width) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            container.style.width = typeof width === 'number' ? `${width}px` : width;\n            this._width = width;\n        }\n    }\n    get width() {\n        return this._width;\n    }\n    setHeight(height) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            container.style.height = typeof height === 'number' ? `${height}px` : height;\n            this._height = height;\n        }\n    }\n    get height() {\n        return this._height;\n    }\n    setPosition(position) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            switch (position) {\n                case 'bottom-right':\n                    container.style.bottom = '10px';\n                    container.style.right = '10px';\n                    break;\n                case 'bottom-left':\n                    container.style.bottom = '10px';\n                    container.style.left = '10px';\n                    break;\n                case 'top-right':\n                    container.style.top = '10px';\n                    container.style.right = '10px';\n                    break;\n                case 'top-left':\n                    container.style.top = '10px';\n                    container.style.left = '10px';\n                    break;\n                case 'center':\n                    container.style.top = '50%';\n                    container.style.left = '50%';\n                    container.style.transform = 'translate(-50%, -50%)';\n                    break;\n                default:\n                    console.warn('Invalid position specified. Defaulting to bottom-right.');\n            }\n            this._position = position;\n        }\n    }\n    get position() {\n        return this._position;\n    }\n    setCustomStyles(styles) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            Object.keys(styles).forEach((key) => {\n                container.style[key] = styles[key];\n            });\n            this._styles = styles;\n        }\n    }\n    get customStyles() {\n        return this._styles;\n    }\n    setTheme(theme) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            switch (theme) {\n                case 'light':\n                    container.style.backgroundColor = '#ffffff';\n                    container.style.color = '#000000';\n                    break;\n                case 'dark':\n                    container.style.backgroundColor = '#000000';\n                    container.style.color = '#ffffff';\n                    break;\n                case 'custom':\n                    // Apply custom styles if any\n                    break;\n                default:\n                    console.warn('Invalid theme specified. Defaulting to light.');\n            }\n            this._theme = theme;\n        }\n    }\n    get theme() {\n        return this._theme;\n    }\n    async _init(options) {\n        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;\n        this._containerId = (_a = options.containerId) !== null && _a !== void 0 ? _a : SpeechAdapter.defaultContainerId;\n        this._lang = (_b = options.lang) !== null && _b !== void 0 ? _b : SpeechAdapter.defaultLang;\n        this._speechEngine = (_c = options.speechEngine) !== null && _c !== void 0 ? _c : SpeechAdapter.defaultSpeechEngine;\n        // Set optional speech-to-text properties with defaults\n        this._speechApiKey = (_d = options.speechApiKey) !== null && _d !== void 0 ? _d : '';\n        this._speechConfidence = (_e = options.speechConfidence) !== null && _e !== void 0 ? _e : SpeechAdapter.defaultConfidence;\n        this._speechEngineParams = options.speechEngineParams || {};\n        // Set UI options with defaults\n        this._autoStart = (_f = options.autoStart) !== null && _f !== void 0 ? _f : false;\n        this._position = (_g = options.position) !== null && _g !== void 0 ? _g : SpeechAdapter.defaultPosition;\n        this._width = (_h = options.width) !== null && _h !== void 0 ? _h : SpeechAdapter.defaultWidth;\n        this._height = (_j = options.height) !== null && _j !== void 0 ? _j : SpeechAdapter.defaultHeight;\n        this._theme = (_k = options.theme) !== null && _k !== void 0 ? _k : SpeechAdapter.defaultTheme;\n        this._styles = options.styles || {\n            backgroundColor: '#ffffff',\n            textColor: '#333333',\n            buttonColor: '#4285f4',\n            buttonTextColor: '#ffffff'\n        };\n        this._core = new _core_coreManager__WEBPACK_IMPORTED_MODULE_0__[\"default\"]({\n            lang: this._lang,\n            engineOptions: {\n                name: this._speechEngine,\n                apiKey: this._speechApiKey,\n                confidence: this._speechConfidence,\n                params: this._speechEngineParams\n            }\n        });\n        await this._core.init();\n    }\n    _createDefaultUI() {\n        var _a;\n        // TODO: Create default container to support speech, change accordingly\n        const container = document.createElement('div');\n        container.id = SpeechAdapter.defaultContainerId;\n        //Inject div into DOM\n        this._setUI(SpeechAdapter.defaultPosition, SpeechAdapter.defaultWidth, SpeechAdapter.defaultHeight, {});\n        this.setTheme((_a = this._theme) !== null && _a !== void 0 ? _a : SpeechAdapter.defaultTheme);\n    }\n    _setUI(position, width, height, styles) {\n        // TODO: Set the given styles , UI options and set the speech container\n        this.setPosition(position !== null && position !== void 0 ? position : SpeechAdapter.defaultPosition);\n        this.setWidth(width !== null && width !== void 0 ? width : SpeechAdapter.defaultWidth);\n        this.setHeight(height !== null && height !== void 0 ? height : SpeechAdapter.defaultHeight);\n        this.setCustomStyles(styles || {});\n    }\n}\n//Constants\nSpeechAdapter.defaultContainerId = 'speech-container';\nSpeechAdapter.defaultConfidence = 0.8;\nSpeechAdapter.defaultPosition = 'bottom-right';\nSpeechAdapter.defaultWidth = '300px';\nSpeechAdapter.defaultHeight = '400px';\nSpeechAdapter.defaultTheme = 'light';\nSpeechAdapter.defaultSpeechEngine = 'default';\nSpeechAdapter.defaultLang = 'en';\nSpeechAdapter.supportedEngines = ['default', 'openai', 'google', 'azure'];\nSpeechAdapter.supportedLangs = ['en', 'no', 'ta', 'si'];\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SpeechAdapter);\n\n\n//# sourceURL=webpack://speech-plug/./src/adapter/speechAdapter.ts?");

/***/ }),

/***/ "./src/core/coreManager.ts":
/*!*********************************!*\
  !*** ./src/core/coreManager.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _util_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/logger */ \"./src/util/logger.ts\");\n\nclass CoreManager {\n    constructor(options) {\n        this.logger = _util_logger__WEBPACK_IMPORTED_MODULE_0__[\"default\"].getInstance();\n        this._lang = options.lang;\n        this.logger.info(\"Core started with options:\", options);\n    }\n    async init() {\n        this.logger.info(\"Core initialized\");\n    }\n    start() {\n        this.logger.info(\"Core started\");\n    }\n    stop() {\n        this.logger.info(\"Core stopped\");\n    }\n    setLang(value) {\n        this._lang = value;\n        this.logger.info(\"Language set to:\", value);\n    }\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CoreManager);\n\n\n//# sourceURL=webpack://speech-plug/./src/core/coreManager.ts?");

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
/******/ const __webpack_exports__default = __webpack_exports__["default"];
/******/ export { __webpack_exports__SpeechAdapter as SpeechAdapter, __webpack_exports__default as default };
/******/ 
