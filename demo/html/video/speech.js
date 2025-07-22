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
      provider: 'openai',
      // provider: 'default',
      apiKey: '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'
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