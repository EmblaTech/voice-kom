document.addEventListener('DOMContentLoaded', () => {  
  VoiceKom.init({   
    wakeWords: ['Hello','Hi'],
    sleepWords: ['Stop listening'],
    containerId: 'speech-container',
    lang: 'en-US', // Set the language
    transcription: {
      provider: 'whisper',
      apiKey: 'sk-proj-' 
    },
    recognition: {
      provider: 'openai',
      // provider: 'default',
      apiKey: '' 
    },
    speakingThreshold: 0.2, 
    
    debug: true
  }).then(() => {
    console.log('VoiceKom has been initialized successfully');
  });

  const contactForm = document.querySelector('.contact-form');

      // Add an event listener to the form for the 'submit' event
      contactForm.addEventListener('submit', (event) => {
        // Prevent the form's default submission action, which reloads the page
        event.preventDefault();

        // Show a confirmation alert to the user
        alert('Inquiry submitted successfully.');

        // Optional: Reset all the form fields to their initial state
        contactForm.reset();
      });
  
});

