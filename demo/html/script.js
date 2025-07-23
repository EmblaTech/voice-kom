document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   // Initialize VoiceKom with params
    wakeWords: ['Hello','Hi'], // Set the wake word
    sleepWords: ['Stop listening', 'Banana'], // Set the sleep words
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
      // provider: 'default'
      apiKey: '' 
    },
    
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  })
  .catch(error => {
    console.error('VoiceKom fails to initialize due to: ', error);
  });
});