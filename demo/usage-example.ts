import voiceLib from '../src/voice-lib';

document.addEventListener('DOMContentLoaded', () => {
  // Get container element
  const container = document.getElementById('voice-lib-container');
  if (!container) {
    console.error('Container element not found!');
    return;
  }
  
  // Initialize the library with options
  voiceLib.init({
    container: container,
    language: 'en', 
    apiKey: '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' // Optional: provide API key here
  })
  .then(() => {
    console.log('VoiceLib initialized successfully');
  })
  .catch(error => {
    console.error('Failed to initialize VoiceLib:', error);
  });
  
});