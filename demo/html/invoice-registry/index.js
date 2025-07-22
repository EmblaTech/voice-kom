VoiceKom.init({
    containerId: 'voice-lib-container', // Changed from container element to containerId string
    lang: 'no',
    sttEngine: 'default',
    sttApiKey: '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',
    nluEngine: 'llm',
    nluApiKey: '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',
  })
  .then(() => {
    console.log('VoiceLib initialized successfully'); })
  .catch(error => {
    console.error('Failed to initialize VoiceLib:', error);
  });