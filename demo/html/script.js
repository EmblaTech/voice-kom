document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    containerId: 'speech-container',
    lang: 'en',
    // position: 'bottom-right',
    // width: '188px',
    // height: '58px',
    transcription: {
      provider: 'default',
    },
    recognition: {
      provider: 'openai',
      // provider: 'default',
    },
    
  }).then(() => {
    console.log('Speech plug library initialized successfully');
  })
  .catch(error => {
    console.error('Speech plug library failed to initialize: ', error);
  });
});
