SpeechPlug Voice Control Library
![alt text](https://img.shields.io/npm/v/speech-plug.svg)

![alt text](https://img.shields.io/travis/com/your-username/speech-plug.svg)

![alt text](https://img.shields.io/npm/l/speech-plug.svg)
SpeechPlug is a powerful, client-side JavaScript library that enables developers to integrate conversational voice control into any web application. It uses advanced Speech-to-Text (STT) and a Large Language Model (LLM) for Natural Language Understanding (NLU) to interpret user commands and interact with web page elements.
Turn "fill the name field with John Doe and click submit" from a user's voice into a real action on your website, with just a few lines of code.
View Live Demo <!-- Add a link to your live demo here -->
✨ Features
LLM-Powered NLU: Goes beyond simple keyword matching. Understands complex, natural user commands thanks to a powerful LLM-based NLU engine.
Easy Integration: Add voice capabilities to your site by including a script and initializing the library with a simple configuration object.
Zero Backend Required: The library is fully client-side (though it relies on external APIs for STT/NLU).
Pre-defined Commands: Out-of-the-box support for common web interactions like clicking buttons, filling forms, checking boxes, scrolling, and more.
Customizable UI: Control the position and appearance of the voice control widget.
Modular & Extensible: Built with TypeScript and InversifyJS for a clean, dependency-injected, and maintainable architecture.
🚀 Getting Started
1. Installation
You can add SpeechPlug to your project via NPM or by using a CDN.
Using NPM:
Generated bash
npm install speech-plug
Use code with caution.
Bash
Then, import it into your project:
Generated javascript
import SpeechPlug from 'speech-plug';
Use code with caution.
JavaScript
Using CDN:
Add the following script tag to your HTML file.
Generated html
<script src="https://cdn.jsdelivr.net/npm/speech-plug/dist/speech-plug.min.js"></script>
Use code with caution.
Html
2. Add the Container
Add a div element to your HTML where the SpeechPlug UI widget will be mounted.
Generated html
<body>
  <!-- Your website content -->
  
  <div id="voice-lib-container"></div>
  
  <!-- Your other scripts -->
</body>
Use code with caution.
Html
3. Initialization
Initialize the library once the DOM is loaded. You will need API keys for the STT and NLU services you choose to use (e.g., OpenAI).
Generated javascript
document.addEventListener('DOMContentLoaded', () => {
  SpeechPlug.init({
    // Required: The ID of the element to host the UI
    containerId: 'voice-lib-container', 

    // Required: Language code (e.g., 'en' for English, 'no' for Norwegian)
    lang: 'en', 

    // --- Speech-to-Text (STT) Configuration ---
    sttEngine: 'default', // Currently supports 'default' (Whisper)
    sttApiKey: 'YOUR_STT_API_KEY', // e.g., Your OpenAI API Key

    // --- Natural Language Understanding (NLU) Configuration ---
    nluEngine: 'llm', // Currently supports 'llm'
    nluApiKey: 'YOUR_NLU_API_KEY', // e.g., Your OpenAI API Key

    // --- Optional UI Customization ---
    autoStart: false, // Set to true to start listening automatically
    position: 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  })
  .then(() => {
    console.log('SpeechPlug initialized successfully!');
  })
  .catch(error => {
    console.error('Failed to initialize SpeechPlug:', error);
  });
});
Use code with caution.
JavaScript
⚙️ API & Configuration
The SpeechPlug.init(config) method accepts a single configuration object.
Parameter	Type	Required	Description
containerId	string	Yes	The ID of the HTML element where the UI widget will be rendered.
lang	string	Yes	The BCP 47 language code for speech recognition (e.g., en-US, es, no).
sttEngine	string	No	The STT engine to use. Defaults to default (Whisper).
sttApiKey	string	Yes	The API key for your chosen STT service.
nluEngine	string	No	The NLU engine to use. Defaults to llm.
nluApiKey	string	Yes	The API key for your chosen NLU service.
autoStart	boolean	No	If true, the microphone will start listening as soon as the library is initialized. Defaults to false.
position	string	No	The position of the UI widget. Can be bottom-right, bottom-left, etc.
theme	object	No	An object to customize colors and styles.
showTranscription	boolean	No	If true, displays the live transcription in the UI. Defaults to true.
🗣️ Supported Commands
SpeechPlug is designed to understand natural language. Below are the core intents it can handle and example phrases.
Command (Intent)	Example Utterances	Description
Click Element	"Click submit", "Press the login button"	Clicks a button, link, or other clickable element.
Fill Input	"Fill username with John", "Enter password as 1234"	Fills a text input, textarea, or search field.
Check Checkbox	"Check agree to terms", "Tick the newsletter box"	Checks a specific checkbox.
Uncheck Checkbox	"Uncheck agree to terms"	Unchecks a specific checkbox.
Select Option	"Select Email in contact preference", "Choose Norway"	Selects an option in a radio group or dropdown.
Scroll	"Scroll down", "Go to the bottom"	Scrolls the page up, down, to the top, or bottom.
Scroll to Element	"Scroll to the footer", "Go to the contact section"	Scrolls a specific element into the view.
Go Back	"Go back"	Navigates to the previous page in history.
The terms in italics are entities that SpeechPlug identifies, such as the target element's name or the value to be entered. It intelligently finds elements based on their aria-label, placeholder, associated <label> text, or button text.
🛠️ How It Works (Architecture)
SpeechPlug is built on a modular, dependency-injected architecture that separates concerns for maximum maintainability and extensibility.
The core flow is as follows:
UI Component: Captures the user's intent to speak (e.g., clicking a microphone button).
Audio Capturer: Uses the browser's MediaDevices API to capture audio from the user's microphone.
STT Driver (Whisper): Sends the captured audio to an external Speech-to-Text service (like OpenAI's Whisper API) and receives a text transcription.
NLP Module (LLM Driver): Sends the transcription to an NLU service (like an LLM via the OpenAI API). It provides the LLM with the transcription, the list of possible commands (from the CommandRegistry), and a simplified representation of the page's interactive elements.
Intent Recognition: The LLM processes this information and returns a structured JSON object identifying the user's intent (e.g., FILL_INPUT) and the entities (e.g., target: "name", value: "John").
Voice Actuator: Receives the structured command and performs the corresponding action on the DOM, such as finding the correct element and dispatching a click or input event.
This entire process is managed by a Core Module that orchestrates the data flow between components.
🤝 Contributing
Contributions are welcome! If you'd like to help improve SpeechPlug, please follow these steps:
Fork the repository.
Create a new branch: git checkout -b feature/your-awesome-feature
Install dependencies: npm install
Make your changes.
Run the build: npm run build
Submit a Pull Request with a clear description of your changes.
📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
