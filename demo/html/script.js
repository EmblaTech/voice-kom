document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    containerId: 'speech-container',
    lang: 'en',
    position: 'bottom-left',
    width: '290px',
    height: '55px',
    transcription: {
      provider: 'default',
      apiKey: ''
    },
    recognition: {
      provider: 'default',
    },
    ui: {
      styles: {
        'backgroundColor': '#ffffff',
      },
    }
  }).then(() => {
    console.log('Speech plug library initialized successfully');
  })
  .catch(error => {
    console.error('Speech plug library failed to initialize: ', error);
  });
});