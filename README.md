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


### 2. Initialization

Initialize the library once the DOM is loaded. You will need API keys for the STT and NLU services you choose to use (e.g., OpenAI).

```javascript
document.addEventListener('DOMContentLoaded', () => {
  VoiceKom.init({
    // Required: The ID of the element to host the UI
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

The `VoiceKom.init(config)` method accepts a single configuration object. All parameters are optional and have sensible defaults unless stated otherwise.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `lang` | `string` | No | The primary BCP 47 language code (e.g., `'en-US'`, `'es-MX'`) to be used for both transcription and recognition. **Default:** `'en'`. |
| `wakeWords` | `string[]` | No | An array of words or phrases that will activate the microphone from an idle or waiting state. Example: `['Hey VoiceKom']`. |
| `sleepWords` | `string[]` | No | An array of words or phrases that will stop the microphone from listening. Example: `['Stop listening']`. |
| `position` | `string` | No | Position of the floating widget. Options: `'bottom-right'`, `'bottom-left'`. **Default:** `'bottom-right'`. |
| `width` | `string` | No | The CSS width of the widget container (e.g., `'350px'`). **Default:** `'300px'`. |
| `height` | `string` | No | The CSS initial height of the widget container (e.g., `'75px'`). **Default:** `'75px'`. |
| `showTranscription`| `boolean`| No | If `true`, the transcribed text is displayed in the widget. **Default:** `true`. |

These parameters are passed within a `transcription` object: `transcription: { ... }`.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `provider` | `string` | No | The speech-to-text engine to use. Options include `'default'` (Web Speech API), `'openai'`, `'google'`, etc. **Default:** `'default'`. |
| `apiKey` | `string` | **Conditionally** | Your API key, required if using a provider other than `'default'`. |

These parameters are passed within a `recognition` object: `recognition: { ... }`.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `provider` | `string` | No | The Natural Language Understanding engine to use for interpreting commands. Options include `'default'` (Compromise js), `'whisper'`, etc.  **Default:** `'default'`. |
| `apiKey` | `string` | **Conditionally** | Your API key, required if using a provider other than `'default'`. |
| `confidence`| `number`| No | The confidence threshold (0 to 1) required for a recognized intent. |



## 🗣️ Supported Commands

VoiceKom's command recognition capability depends on the `recognition.provider` you select in your configuration. Each provider offers a different balance of speed, flexibility, and intelligence.

### Default Provider
*(**Config:** `recognition: { provider: 'default' }`)*

The `default` provider is a fast, lightweight, and offline-first engine. It operates on a strict set of command patterns and is designed for simple, direct instructions. It is not conversational and expects commands to be given one at a time in a specific format.

| Intent | Command Structure | Alternative Verbs | Examples |
| :--- | :--- | :--- | :--- |
| Clicking Elements | `Click <element name>` | `Press` | `"Click submit"`<br>`"Press the login button"` |
| Filling Text Fields | `Fill <field name> with <text to enter>`| `Enter`, `As` | `"Fill username with John Doe"`<br>`"Enter password as 123456"` |
| Typing in Text Areas | `Type in <field name> as <text>` | `In` | `"Type in message as this is a great product"` |
| Checking/Unchecking | `Check <checkbox name>` <br> `Uncheck <checkbox name>` <br> `Check all <group name>` <br> `Uncheck all <group name>` | - | `"Check agree to terms"`<br>`"Uncheck newsletter"`<br>`"Check all interests"` |
| Selecting from Lists | `Select <option name> in <list name>` <br> `Open <dropdown name>` | `Choose` | `"Select Norway in country"`<br>`"Open the state dropdown"` |
| Navigating | `Scroll <direction>` <br> `Scroll to <element name>` <br> `Scroll to the <position>` | `Go to` | `"Scroll down"`<br>`"Scroll to the footer"`<br>`"Go to the top"` |

**Note:** The terms in `<...>` are placeholders for the name of the UI element (e.g., its label, placeholder) or the value you want to use.



### OpenAI Provider
*(**Config:** `recognition: { provider: 'openai', apiKey: '...' }`)*

When using the `openai` provider, VoiceKom becomes a powerful conversational assistant. This provider is slower as it requires an internet connection, but it can understand natural language, context, and even multiple commands in a single, continuous utterance.

You can be as natural as you want, as long as your intent is clear.
> “Name is Alex, email is alex@gmail.com, phone number 071662, preferred date tomorrow, preferred time is 3 hrs from now. Select phone in preferred contact method. Check everything except upcoming events in interests. Select feedback in subject. Type Good morning Alex in message. I agree to terms and conditions. Finally, submit.”

#### 💡 Best Practices for the OpenAI Provider:
*   **Be Clear with Your Intent:** If you want to select from a list, use a verb like "select" or "choose". Saying "country is Sri Lanka" might be interpreted as typing into an input field named "country". A clearer command would be "**Select** country Sri Lanka".
*   **Checkboxes vs. Selections:** Checking a checkbox within a group is a distinct action. For a group of radio buttons, use "select" or "choose". For checkboxes, use "check" or "uncheck".

### How VoiceKom Finds Elements
For both providers, VoiceKom intelligently finds UI elements on the page based on their `aria-label`, `placeholder` text, the text content of an associated `<label>`, or the text inside a button.


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
