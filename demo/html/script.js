document.addEventListener('DOMContentLoaded', () => {
   const creditorSelect = document.getElementById('creditor');
    const formElements = [
        document.getElementById('transactionType'),
        document.getElementById('voucherDate'),
        document.getElementById('dueDate'),
        document.getElementById('refNo'),
        document.getElementById('amount'),
        document.getElementById('transtext'),
        document.getElementById('addTransaction')
    ];

    // Initially disable all elements
    formElements.forEach(element => {
        element.disabled = true;
    });

    // Enable/disable elements based on creditor selection
    creditorSelect.addEventListener('change', function() {
        const isCreditorSelected = this.value !== '';
        formElements.forEach(element => {
            element.disabled = !isCreditorSelected;
        });
    });

  
  
  // Initialize VoiceLib with just the ID string
  SpeechPlug.init({
    containerId: 'voice-lib-container', // Changed from container element to containerId string
    lang: 'en',
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


  document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show notification
    const notification = document.getElementById('notification');
    notification.textContent = 'Transaction added successfully!';
    notification.style.display = 'block';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
    
    // Process your form submission here
});
});

function formatCurrency(input) {
    // Remove non-digit characters
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Ensure only two decimal places
    let parts = value.split('.');
    if (parts.length > 1) {
        parts[1] = parts[1].slice(0, 2);
        value = parts.join('.');
    }
    
    // Format with two decimal places
    input.value = value ? parseFloat(value).toFixed(2) : '';
}