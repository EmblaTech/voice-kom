document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
    containerId: 'speech-plug-container',
    lang: 'en',
    transcriptionProvider: {
      name: 'default',
    },
    recognitionProvider: {
      name: 'default',
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