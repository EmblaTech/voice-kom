# VoiceKom Library

VoiceKom is a powerful, lightweight JavaScript library that lets you seamlessly add voice interaction to any existing web application.
It runs fully on the client side and uses advanced Speech-to-Text (STT) and Large Language Models (LLMs) for Natural Language Understanding (NLU) — enabling users to speak naturally and control page elements easily.

Just say “Fill name with John Smith” — VoiceKom intelligently fills the right input field, selects dropdowns, sets date pickers, chooses radio buttons, navigates menus, and clicks buttons — all without you touching the keyboard or mouse. And the best part? It takes just a few lines of code to integrate.

## ✨ Features

- **LLM-Powered NLU**: Goes beyond simple keyword matching. Understands complex, natural user commands.
- **Chained Commands**: Handle multiple actions in a single sentence (e.g., “Fill name with John and then click submit”).
- **Multi-language**: Makes it adaptable for global use, breaking language barriers and making digital platforms more inclusive.
- **Privacy-First Design**: No user data sent by default. All processing stays local unless configured otherwise.
- **Easy Integration**: Add voice capabilities to your site by including a script and initializing the library with a simple configuration object.
- **Zero Backend Required**: The library is fully client-side (optional API integration for enhanced accuracy APIs based on the configuration).
- **Pre-defined Commands**: Out-of-the-box support for common web interactions like clicking buttons, filling forms, checking boxes, scrolling, and more.
- **Customizable UI**: Easily style voice widget with theming and localization support.
- **Wake & Sleep Words**: Start or stop listening on command — useful for continuous workflows.
- **Modular & Extensible**: Built with TypeScript, clean, extensible driver architecture.

## 🚀 Getting Started

### 1. Installation
```
**Using CDN:**
Add the following script tag to your HTML file.

```html
<script src="[https://voicekom.embla.asia/dist/voicekom.min.js](https://voicekom.embla.asia/dist/voicekom.min.js)"></script>
```


### 2. Initialization

Initialize the VoiceKom library **after the DOM has fully loaded** to ensure proper setup.

##### 🔐 Using External AI Engines

If you wish to use external AI engines such as **OpenAI** for transcription and recognition, you will need to provide your own API keys.

> ⚠️ **Important:** Supplying API keys directly in the frontend is **insecure** and not recommended for production environments.

##### ⚙️ Default In-Browser Mode

VoiceKom can run **entirely in the browser** without any external AI dependencies. In this mode:
- Transcription and recognition are handled locally
- Offers **faster performance**
- Ensures **maximum privacy**
- May have **less flexibility** compared to external engines and is less flexible for complex or nuanced language understanding compared to LLM-powered alternatives.

This mode is ideal if you want simplicity and privacy without compromising usability.

##### ☁️ Secure External Integration (Recommended)

If you still prefer using services like OpenAI **without exposing your API key**, we can help:
- Contact us to set up a **Tenant profile** for you
- We'll route your requests through our **proxied API**, keeping your keys safe
- Optionally, you may **host the proxy backend yourself** as well for full control

##### 🧩 Flexible Architecture

VoiceKom supports multiple integration paths:
- Use local-only mode
- Connect with your own AI backend
- Proxy through our secured services
- Or build a hybrid model

This flexibility allows you to **choose the architecture** that best fits your **use case, infrastructure, and compliance needs**.

---
    
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

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lang` | `string` | No | `'en'` | The primary BCP 47 language code (e.g., `'en-US'`) for transcription and recognition. |
| `wakeWords` | `string[]` | No | `[]` | An array of phrases that will activate the microphone from an idle state. Example: `['Hey VoiceKom']`. |
| `sleepWords` | `string[]` | No | `[]` | An array of phrases that will stop the microphone from listening. Example: `['Stop listening']`. |
| `position` | `string` | No | `'bottom-right'` | Position of the floating widget. Options: `'bottom-right'`, `'bottom-left'`. |
| `width` | `string` | No | `'300px'` | The CSS width of the widget container (e.g., `'350px'`). |
| `height` | `string` | No | `'75px'` | The CSS initial height of the widget container (e.g., `'75px'`). |
| `showTranscription`| `boolean`| No | `true` | If `true`, the transcribed text is displayed in the widget. |

These parameters are passed within a `transcription` object: `transcription: { ... }`.

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `provider` | `string` | No | `'default'` | The speech-to-text engine. Options: `'default'` (Web Speech API), `'openai'`, etc. |
| `apiKey` | `string` | **Conditionally** | `N/A` | Your API key, required if using a provider other than `'default'`. |

These parameters are passed within a `recognition` object: `recognition: { ... }`.

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `provider` | `string` | No | `'default'` | The NLU engine for interpreting commands. Options: `'default'` (Compromise.js), `'openai'`, etc. |
| `apiKey` | `string` | **Conditionally** | `N/A` | Your API key, required if using a provider other than `'default'`. |
| `confidence`| `number`| No | `0.8` | The confidence threshold (0 to 1) required for a recognized intent. |


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
