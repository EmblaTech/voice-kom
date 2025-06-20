document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    containerId: 'speech-container',
    lang: 'en',
    position: 'bottom-right',
    width: '188px',
    height: '58px',
    transcription: {
      provider: 'default',
      apiKey: ''
    },
    recognition: {
      provider: 'default',
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