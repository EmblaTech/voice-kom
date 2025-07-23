// const { cli } = require("webpack");

document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   
    wakeWords: ['Hello','Hi'],
    sleepWords: ['Stop listening'],
    containerId: 'speech-container',
    lang: 'en',
    transcription: {
      provider: 'default',
      temperature: '',
      apiKey: '123',
    },
    recognition: {
      provider: 'voicekom',
      temperature: '',
      apiKey: '123',
    },
    // Add debug logging
    debug: true
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  });
});