document.addEventListener('DOMContentLoaded', () => {  
  // Initialize SpeechPlug with just the ID string
  SpeechPlug.init({
    containerId: 'speech-plug-container',
    lang: 'en',
    transcriptionProvider: {
      name: 'dd',
    },
    recognitionProvider: {
      name: 'default',
    },
    ui: {
      styles: {
        'backgroundColor': '#ffffff',
      },
    }
  })
  .then(() => {
    console.log('VoiceLib initialized successfully');
  })
  .catch(error => {
    console.error('Failed to initialize VoiceLib:', error);
  });
});