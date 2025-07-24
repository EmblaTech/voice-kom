# VoiceKom Library

VoiceKom is a powerful, client-side JavaScript library that enables developers to integrate conversational voice control into any web application. It uses advanced Speech-to-Text (STT) and a Large Language Model (LLM) for Natural Language Understanding (NLU) to interpret user commands and interact with web page elements.

Turn "fill the name field with John Doe and click submit" from a user's voice into a real action on your website, with just a few lines of code.

## ✨ Features

- **LLM-Powered NLU**: Goes beyond simple keyword matching. Understands complex, natural user commands thanks to a powerful LLM-based NLU engine.
- **Easy Integration**: Add voice capabilities to your site by including a script and initializing the library with a simple configuration object.
- **Zero Backend Required**: The library is fully client-side (though it relies on external APIs for STT/NLU).
- **Pre-defined Commands**: Out-of-the-box support for common web interactions like clicking buttons, filling forms, checking boxes, scrolling, and more.
- **Customizable UI**: Control the position and appearance of the voice control widget.
- **Modular & Extensible**: Built with TypeScript and InversifyJS for a clean, dependency-injected, and maintainable architecture.

## 🚀 Getting Started

### 1. Installation

You can add VoiceKom to your project via NPM or by using a CDN.

**Using NPM:**

```bash
npm install voicekom
```

Then, import it into your project:

```javascript
import VoiceKom from 'voicekom';
```

**Using CDN:**
Add the following script tag to your HTML file.

```html
<script src="https://voicekom.embla.asia/dist/voicekom.min.js"></script>
```

### 2. Add the Container

Add a div element to your HTML where the VoiceKom UI widget will be mounted.

```html
<body>
  <!-- Your website content -->  
  <div id="voicekom-widget"></div>  
  <!-- Your other scripts -->
</body>
```

### 3. Initialization

Initialize the library once the DOM is loaded. You will need API keys for the STT and NLU services you choose to use (e.g., OpenAI).

```javascript
document.addEventListener('DOMContentLoaded', () => {
  VoiceKom.init({
    // Required: The ID of the element to host the UI
    widgetId: 'voicekom-widget', 
    // Required: Language code (e.g., 'en' for English, 'no' for Norwegian)
    lang: 'en', 
    // --- Speech-to-Text (STT) Configuration ---
    transcription: { "provider": "default" }, // Supports WebSpeech API(default), Whisper
    recognition: { "provider": "default" }, // Supports Compromise(default), OpenAI

// --- Optional UI Customization ---
    autoStart: false, // Set to true to start listening automatically
    position: 'bottom-right' // 'bottom-right', 'bottom-left'
  })
  .then(() => {
    console.log('VoiceKom initialized successfully!');
  })
  .catch(error => {
    console.error('Failed to initialize VoiceKom:', error);
  });
});
```

## ⚙️ API & Configuration

The `VoiceKom.init(config)` method accepts a single configuration object.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `widgetId` | string | Yes | The ID of the HTML element where the UI widget will be rendered. |
| `lang` | string | Yes | The BCP 47 language code for speech recognition (e.g., en-US, es, no). |
| `transcription` | object | No | The Speech-to-Text engine to use. Defaults to `default` (WebSpeechAPI). |
| `transcription.provider` | string | No | Specifies which STT provider to use. E.g., openai, google, default.. |
| `transcription.language` | string | No | Language code (e.g., en, no). |
| `transcription.temperature` | string | No | Controls randomness of AI responses (if applicable). Range: 0–1. |
| `autoStart` | boolean | No | If true, the microphone will start listening as soon as the library is initialized. Defaults to `false`. |
| `position` | string | No | The position of the UI widget. Can be `bottom-right`, `bottom-left`, etc. |
| `showTranscription` | boolean | No | If true, displays the live transcription in the UI. Defaults to `true`. |

## 🗣️ Supported Commands

VoiceKom is designed to understand natural language. Below are the core intents it can handle and example phrases.

| Command (Intent) | Example Utterances | Description |
|------------------|-------------------|-------------|
| Click Element | "Click submit", "Press the login button" | Clicks a button, link, or other clickable element. |
| Fill Input | "Fill username with John", "Enter password as 1234" | Fills a text input, textarea, or search field. |
| Check Checkbox | "Check agree to terms", "Tick the newsletter box" | Checks a specific checkbox. |
| Uncheck Checkbox | "Uncheck agree to terms" | Unchecks a specific checkbox. |
| Select Option | "Select Email in contact preference", "Choose Norway" | Selects an option in a radio group or dropdown. |
| Scroll | "Scroll down", "Go to the bottom" | Scrolls the page up, down, to the top, or bottom. |
| Scroll to Element | "Scroll to the footer", "Go to the contact section" | Scrolls a specific element into the view. |
| Go Back | "Go back" | Navigates to the previous page in history. |

The terms in *italics* are entities that VoiceKom identifies, such as the target element's name or the value to be entered. It intelligently finds elements based on their `aria-label`, `placeholder`, associated `<label>` text, or button text.

## 🛠️ How It Works (Architecture)

VoiceKom is built on a modular, with an expandable driver-based structure, allowing key components to be easily swapped or extended. separates concerns for maximum maintainability and extensibility.

The core flow is as follows:

1. **UI Component**: Captures the user's intent to speak (e.g., clicking a microphone button).

2. **Audio Capturer**: Uses the browser's MediaDevices API to capture audio from the user's microphone.

3. **Transcription Driver (Whisper)**: Sends the captured audio to Speech-to-Text service (e.g: Whisper API) and receives a text transcription.

4. **Intent Recognition Driver (OpenAI)**: Sends the transcripted text to an AI service (e.g: OpenAI API) which processes and returns a structured JSON object identifying the user's intent (e.g., `FILL_INPUT`) and the entities (e.g., `target: "name"`, `value: "John"`).

5. **Voice Actuator**: Receives the structured command and performs the corresponding action on the DOM, such as finding the correct element and dispatching a click or input event.

This entire process is managed by a **Core Module** that orchestrates the data flow between components.

## 🤝 Contributing

Contributions are welcome! If you'd like to help improve VoiceKom, please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-awesome-feature`
3. Install dependencies: `npm install`
4. Make your changes.
5. Run the build: `npm run build`
6. Submit a Pull Request with a clear description of your changes.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
