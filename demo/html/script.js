document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   // Initialize SpeechPlug with params
    wakeWord: 'Hello', // Set the wake word
    containerId: 'speech-container',
    lang: 'en',
    // position: 'bottom-right',
    // width: '188px',
    // height: '58px',
    transcription: {
      provider: 'webspeech',
      apiKey: '' 
    },
    recognition: {
      provider: 'openai',
      // provider: 'default',
      apiKey: '' 
    },
    
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  })
  .catch(error => {
    console.error('VoiceKom fails to initialize due to: ', error);
  });
});