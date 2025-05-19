document.addEventListener('DOMContentLoaded', () => {
  // Form handling
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Form submitted successfully!');
  });
  
  // Initialize VoiceLib with just the ID string
  SpeechPlug.init({
    containerId: 'voice-lib-container', // Changed from container element to containerId string
    lang: 'en',
    sttEngine: 'default',
    sttApiKey: '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'
  })
  .then(() => {
    console.log('VoiceLib initialized successfully');
  })
  .catch(error => {
    console.error('Failed to initialize VoiceLib:', error);
  });
});