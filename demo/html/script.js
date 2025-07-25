document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   // Initialize VoiceKom with params
    wakeWords: ['Hello','Hi'], // Set the wake word
    sleepWords: ['Stop listening'], // Set the sleep words
    // widgetId: 'speech-container',
    lang: 'en-US', // Set the language
    // position: 'bottom-right',
    // width: '188px',
    // height: '58px',
    transcription: {
      provider: 'default',
      apiKey: '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' 
    },
    recognition: {
      provider: 'openai',
      // provider: 'default'
      apiKey: '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' 
    },
    
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  })
  .catch(error => {
    console.error('VoiceKom fails to initialize due to: ', error);
  });
});