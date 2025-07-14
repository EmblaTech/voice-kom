document.addEventListener('DOMContentLoaded', () => {

  // Form handling
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Basic form validation
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const agreeTerms = document.getElementById('agree-terms').checked;
    
    if (!name || !email) {
      alert('Please fill out all required fields.');
      return;
    }
    
    if (!agreeTerms) {
      alert('Please agree to the Terms and Conditions.');
      return;
    }
    
    // If validation passes
    alert('Form submitted successfully!');
    form.reset();
  });
  
  // Handle reset button
  form.addEventListener('reset', () => {
    setTimeout(() => {
      // Ensure radio buttons default state is restored
      document.querySelector('input[name="contact-preference"][value="email"]').checked = true;
    }, 10);
  });
  
  // Modal handling
  const termsModal = document.getElementById('terms-modal');
  const termsLink = document.getElementById('terms-link');
  const closeModal = document.querySelector('.close');
  const acceptTerms = document.querySelector('.modal-content .btn');
  
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    termsModal.style.display = 'block';
  });
  
  closeModal.addEventListener('click', () => {
    termsModal.style.display = 'none';
  });
  
  acceptTerms.addEventListener('click', () => {
    document.getElementById('agree-terms').checked = true;
    termsModal.style.display = 'none';
  });
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', (e) => {
    if (e.target === termsModal) {
      termsModal.style.display = 'none';
    }
  });
  
  // Help and FAQ links
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Help section would open here in a real application.');
  });
  
  document.getElementById('faq-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('FAQ section would open here in a real application.');
  });
  



  // Initialize VoiceLib with just the ID string
  SpeechPlug.init({

    // containerId: 'voice-lib-container', // Changed from container element to containerId string
    // lang: 'no',
    // sttEngine: 'default',
    // sttApiKey: '',
    // nluEngine: 'llm',
    // nluApiKey: '',
  
    transcription: {
      provider: 'default',
      apiKey: ''
    },
    recognition: {
      provider: 'openai',
      apiKey: ''
    },

    clientId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    serverUrl: 'http://localhost:3001', // Override the default for local dev (optional)

    containerId: 'speech-container',
    lang: 'en',
    position: 'bottom-right',
    width: '188px',
    height: '58px',
    ui: {
      url : 'custom-style.css',  
      styles: {
        backgroundColor:  ' #b4e70d',
        border: '3px solid  rgb(0, 0, 0)'
      },
    }

  })

  .then(() => {
    console.log('111 VoiceLib initialized successfully'); })
  .catch(error => {
    console.error('111 Failed to initialize VoiceLib:', error);
  });

});