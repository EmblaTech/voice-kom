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
      apiKey: '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'
    },
    recognition: {
      provider: 'default',
      // provider: 'default',
      apiKey: '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'
    },
    
  }).then(() => {
    console.log('Speech plug library initialized successfully');
  })
  .catch(error => {
    console.error('Speech plug library failed to initialize: ', error);
  });
});