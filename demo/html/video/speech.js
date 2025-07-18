document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    wakeWord: 'Hello', // Set the wake word
    containerId: 'speech-container',
    lang: 'en',
    // position: 'bottom-right',
    // width: '188px',
    // height: '58px',
    transcription: {
      provider: 'default',
      apiKey: import.meta.env.VITE_SPEECHPLUG_TRANSCRIPTION_API_KEY
    },
    recognition: {
      provider: 'default',
      // provider: 'default',
      apiKey: import.meta.env.VITE_SPEECHPLUG_RECOGNITION_API_KEY
    },
    
  }).then(() => {
    console.log('Speech plug library initialized successfully');
  })
  .catch(error => {
    console.error('Speech plug library failed to initialize: ', error);
  });
});