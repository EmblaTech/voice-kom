document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    clientId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    serverUrl: 'http://localhost:3001', // Override the default for local dev (optional)
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
      provider: 'openai',
      apiKey: ''
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