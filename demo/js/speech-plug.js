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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SpeechAdapter: () => (/* binding */ SpeechAdapter),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\nclass SpeechAdapter {\n    constructor(options) {\n        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;\n        this._containerId = (_a = options.containerId) !== null && _a !== void 0 ? _a : SpeechAdapter.defaultContainerId;\n        this._lang = (_b = options.lang) !== null && _b !== void 0 ? _b : 'en';\n        this._speechEngine = (_c = options.speechEngine) !== null && _c !== void 0 ? _c : 'default';\n        // Set optional speech-to-text properties with defaults\n        this._speechApiKey = (_d = options.speechApiKey) !== null && _d !== void 0 ? _d : '';\n        this._speechConfidence = (_e = options.speechConfidence) !== null && _e !== void 0 ? _e : 0.8;\n        this._speechEngineParams = options.speechEngineParams || {};\n        // Set UI options with defaults\n        this._autoStart = (_f = options.autoStart) !== null && _f !== void 0 ? _f : false;\n        this._position = (_g = options.position) !== null && _g !== void 0 ? _g : SpeechAdapter.defaultPosition;\n        this._width = (_h = options.width) !== null && _h !== void 0 ? _h : SpeechAdapter.defaultWidth;\n        this._height = (_j = options.height) !== null && _j !== void 0 ? _j : SpeechAdapter.defaultHeight;\n        this._theme = (_k = options.theme) !== null && _k !== void 0 ? _k : SpeechAdapter.defaultTheme;\n        this._styles = options.styles || {\n            backgroundColor: '#ffffff',\n            textColor: '#333333',\n            buttonColor: '#4285f4',\n            buttonTextColor: '#ffffff'\n        };\n        console.log(\"SpeechAdapter initialized\", this);\n    }\n    renderUI() {\n        if (!this._containerId) { //If container is empty, then inject default container into the DOM\n            this.createDefaultUI();\n            console.log(\"Default UI container created\");\n        }\n        else {\n            this.setUI(this._position, this._width, this._height, this._styles);\n            console.log(\"Set container with these options\", this._position, this._width, this._height, this._styles);\n        }\n    }\n    start() {\n        console.log(\"Listening started\");\n    }\n    stop() {\n        console.log(\"Listening stopped\");\n    }\n    set containerId(value) {\n        this._containerId = value;\n    }\n    get containerId() {\n        return this._containerId;\n    }\n    set lang(value) {\n        if (!SpeechAdapter.supportedLangs.includes(value)) {\n            console.warn(`Language '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedLangs.join(', ')}`);\n        }\n        this._lang = value;\n    }\n    get lang() {\n        return this._lang;\n    }\n    set speechEngine(value) {\n        if (!SpeechAdapter.supportedEngines.includes(value)) {\n            console.warn(`Speech engine '${value}' might not be supported. Valid options are: ${SpeechAdapter.supportedEngines.join(', ')}`);\n        }\n        this._speechEngine = value;\n    }\n    get speechEngine() {\n        return this._speechEngine;\n    }\n    set speechApiKey(value) {\n        this._speechApiKey = value;\n    }\n    get speechApiKey() {\n        return this._speechApiKey;\n    }\n    set speechConfidence(value) {\n        if (value < 0 || value > 1) {\n            console.warn(`Confidence value '${value}' is out of range. It should be between 0 and 1.`);\n        }\n        this._speechConfidence = value;\n    }\n    get speechConfidence() {\n        return this._speechConfidence;\n    }\n    set speechEngineParams(value) {\n        this._speechEngineParams = value;\n    }\n    get speechEngineParams() {\n        return this._speechEngineParams;\n    }\n    set autoStart(value) {\n        this._autoStart = value;\n    }\n    get autoStart() {\n        return this._autoStart;\n    }\n    set width(width) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            container.style.width = typeof width === 'number' ? `${width}px` : width;\n            this._width = width;\n        }\n    }\n    get width() {\n        return this._width;\n    }\n    set height(height) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            container.style.height = typeof height === 'number' ? `${height}px` : height;\n            this._height = height;\n        }\n    }\n    get height() {\n        return this._height;\n    }\n    set position(position) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            switch (position) {\n                case 'bottom-right':\n                    container.style.bottom = '10px';\n                    container.style.right = '10px';\n                    break;\n                case 'bottom-left':\n                    container.style.bottom = '10px';\n                    container.style.left = '10px';\n                    break;\n                case 'top-right':\n                    container.style.top = '10px';\n                    container.style.right = '10px';\n                    break;\n                case 'top-left':\n                    container.style.top = '10px';\n                    container.style.left = '10px';\n                    break;\n                case 'center':\n                    container.style.top = '50%';\n                    container.style.left = '50%';\n                    container.style.transform = 'translate(-50%, -50%)';\n                    break;\n                default:\n                    console.warn('Invalid position specified. Defaulting to bottom-right.');\n            }\n            this._position = position;\n        }\n    }\n    get position() {\n        return this._position;\n    }\n    set customStyles(styles) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            Object.keys(styles).forEach((key) => {\n                container.style[key] = styles[key];\n            });\n            this._styles = styles;\n        }\n    }\n    get customStyles() {\n        return this._styles;\n    }\n    set theme(theme) {\n        const container = document.getElementById(this._containerId);\n        if (container) {\n            switch (theme) {\n                case 'light':\n                    container.style.backgroundColor = '#ffffff';\n                    container.style.color = '#000000';\n                    break;\n                case 'dark':\n                    container.style.backgroundColor = '#000000';\n                    container.style.color = '#ffffff';\n                    break;\n                case 'custom':\n                    // Apply custom styles if any\n                    break;\n                default:\n                    console.warn('Invalid theme specified. Defaulting to light.');\n            }\n            this._theme = theme;\n        }\n    }\n    get theme() {\n        return this._theme;\n    }\n    createDefaultUI() {\n        var _a;\n        // TODO: Create default container to support speech, change accordingly\n        const container = document.createElement('div');\n        container.id = SpeechAdapter.defaultContainerId;\n        //Inject div into DOM\n        this.setUI(SpeechAdapter.defaultPosition, SpeechAdapter.defaultWidth, SpeechAdapter.defaultHeight, {});\n        this.theme = (_a = this._theme) !== null && _a !== void 0 ? _a : SpeechAdapter.defaultTheme;\n    }\n    setUI(position, width, height, styles) {\n        // TODO: Set the given styles , UI options and set the speech container\n        this.position = position !== null && position !== void 0 ? position : SpeechAdapter.defaultPosition;\n        this.width = width !== null && width !== void 0 ? width : SpeechAdapter.defaultWidth;\n        this.height = height !== null && height !== void 0 ? height : SpeechAdapter.defaultHeight;\n        this.customStyles = styles || {};\n    }\n}\n//Constants\nSpeechAdapter.defaultContainerId = 'speech-container';\nSpeechAdapter.defaultConfidence = 0.8;\nSpeechAdapter.defaultPosition = 'bottom-right';\nSpeechAdapter.defaultWidth = '300px';\nSpeechAdapter.defaultHeight = '400px';\nSpeechAdapter.defaultTheme = 'light';\nSpeechAdapter.supportedEngines = ['default', 'openai', 'google', 'azure'];\nSpeechAdapter.supportedLangs = ['en', 'no', 'ta', 'si'];\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SpeechAdapter);\n\n\n//# sourceURL=webpack://speech-plug/./src/adapter/speechAdapter.ts?");

/***/ })

/******/ });
/************************************************************************/
/******/ // The require scope
/******/ var __webpack_require__ = {};
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
/******/ var __webpack_exports__ = {};
/******/ __webpack_modules__["./src/adapter/speechAdapter.ts"](0, __webpack_exports__, __webpack_require__);
/******/ const __webpack_exports__SpeechAdapter = __webpack_exports__.SpeechAdapter;
/******/ const __webpack_exports__default = __webpack_exports__["default"];
/******/ export { __webpack_exports__SpeechAdapter as SpeechAdapter, __webpack_exports__default as default };
/******/ 
