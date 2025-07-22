// const { cli } = require("webpack");

document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   // Initialize VoiceKom with params
    wakeWords: ['Hello','Hi'], // Set the wake word
    sleepWords: ['Stop listening'], // Set the sleep words
    containerId: 'speech-container',
    lang: 'en',
    // position: 'bottom-right',
    // width: '188px',
    // height: '58px',
    clientId: '123',
    transcription: {
      provider: 'whisper', // 'whisper' or 'default' 
      temperature: '',
      apiKey: ''
    },
    recognition: {
      provider: 'default', // 'openai' or 'default' 
      temperature: '',
      apiKey: ''
    },
    
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  })
  .catch(error => {
    console.error('VoiceKom fails to initialize due to: ', error);
  });
});