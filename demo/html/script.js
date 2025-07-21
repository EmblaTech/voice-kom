document.addEventListener('DOMContentLoaded', () => {  
  SpeechPlug.init({   // Initialize SpeechPlug with params
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
      provider: 'default',
      // provider: 'default',
      apiKey: '' 
    },
    
  }).then(() => {
    console.log('Speech plug library initialized successfully');
  })
  .then(() => {
    console.log('111 VoiceLib initialized successfully'); })
  .catch(error => {
    console.error('111 Failed to initialize VoiceLib:', error);
  });
});