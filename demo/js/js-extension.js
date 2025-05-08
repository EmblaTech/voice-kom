import { SpeechAdapter } from './speech-plug.js';
let speechAdapter = null;
let isStarted = false
document.addEventListener("DOMContentLoaded", function() {
    speechAdapter = new SpeechAdapter();   
    speechAdapter.init({
        containerId: "speech-container", 
        lang: "no", 
        speechEngine: "default",
        speechConfidence: 0.8, 
        position: "bottom-right",
        width: 600,
        height: 300,
        styles: {backgroundColor: "white", color: "black", fontSize: "16px", fontFamily: "Arial"},
        speechEngineParams: {}
    }) 
    speechAdapter.setAutoStart(true);   //Another way to pass parameter
    speechAdapter.renderUI();
})

// Start voice recognition on button click
document.getElementById('toggle-voice').addEventListener('click', () => {
    if(isStarted) {
        document.getElementById('toggle-voice').innerText = "Start Voice";
        speechAdapter.stop();
        isStarted = false;        
    }
    else {
        document.getElementById('toggle-voice').innerText = "Stop Voice";
        speechAdapter.start();
        isStarted = true;
    }
});