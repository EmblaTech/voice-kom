document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   
    wakeWords: ['Hello','Hi'],
    sleepWords: ['Stop listening'],
    containerId: 'speech-container',
    lang: 'si-LK', // Set the language
    transcription: {
      provider: 'webspeech',
      apiKey: '' 
    },
    recognition: {
      provider: 'default',
      // provider: 'default',
      apiKey: '' 
    },
    speakingThreshold: 0.2, 
    
    debug: true
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  });
});