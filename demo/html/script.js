document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    containerId: 'speech-container',
    lang: 'en',
    position: 'bottom-right',
    width: '188px',
    height: '58px',
    transcription: {
      provider: 'default',
      apiKey: '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'
    },
    recognition: {
      provider: 'openai',
      apiKey: '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'
    },
    ui: {
      url : 'custom-style.css',  
      styles: {
        backgroundColor:  ' #b4e70d',
        border: '3px solid  rgb(0, 0, 0)'
      },
    }
  }).then(() => {
    console.log('Speech plug library initialized successfully');
  })
  .catch(error => {
    console.error('Speech plug library failed to initialize: ', error);
  });
});