document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation & Dashboard Logic ---
    const dashboardLink = document.getElementById('dashboard-link');
    const portfolioLink = document.getElementById('portfolio-link');
    const passwordModal = document.getElementById('password-modal');
    const closeModal = document.getElementById('close-modal');
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    
    const portfolioSection = document.getElementById('portfolio');
    const dashboardSection = document.getElementById('dashboard');
    const logoutBtn = document.getElementById('logout-btn');

    // Hardcoded simple password for demonstration
    const DOCTOR_PASSWORD = "password123";

    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        // If already in dashboard, do nothing
        if (dashboardSection.classList.contains('active')) return;
        
        passwordModal.classList.remove('hidden');
        passwordInput.value = '';
        loginError.classList.add('hidden');
        passwordInput.focus();
    });

    portfolioLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPortfolio();
    });

    closeModal.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
    });

    // Close modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.classList.add('hidden');
        }
    });

    loginBtn.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    function attemptLogin() {
        if (passwordInput.value === DOCTOR_PASSWORD) {
            passwordModal.classList.add('hidden');
            portfolioSection.classList.remove('active');
            portfolioSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            dashboardSection.classList.add('active');
            
            // Highlight active link (simple approach)
            dashboardLink.style.textDecoration = 'underline';
            portfolioLink.style.textDecoration = 'none';
        } else {
            loginError.classList.remove('hidden');
        }
    }

    function showPortfolio() {
        dashboardSection.classList.remove('active');
        dashboardSection.classList.add('hidden');
        portfolioSection.classList.remove('hidden');
        portfolioSection.classList.add('active');
        
        // Reset active link styles
        portfolioLink.style.textDecoration = 'underline';
        dashboardLink.style.textDecoration = 'none';
    }

    // Set initial link style
    portfolioLink.style.textDecoration = 'underline';

    logoutBtn.addEventListener('click', () => {
        showPortfolio();
    });

    // --- Notes Form Logic ---
    const notesForm = document.getElementById('notes-form');
    const submitSuccess = document.getElementById('submit-success');

    notesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, this would send data to a backend
        const patientName = document.getElementById('patient-name').value;
        const patientNotes = document.getElementById('patient-notes').value;
        
        console.log("Saving data...");
        console.log("Patient:", patientName);
        console.log("Notes:", patientNotes);
        
        submitSuccess.classList.remove('hidden');
        notesForm.reset();
        
        setTimeout(() => {
            submitSuccess.classList.add('hidden');
        }, 3000);
    });

    // --- Chatbot Logic ---
    const chatbotHeader = document.getElementById('chatbot-header');
    const chatbotBody = document.getElementById('chatbot-body');
    const chatbotToggleIcon = document.getElementById('chatbot-toggle-icon');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    chatbotHeader.addEventListener('click', () => {
        chatbotBody.classList.toggle('hidden');
        if (chatbotBody.classList.contains('hidden')) {
            chatbotToggleIcon.textContent = '▲';
        } else {
            chatbotToggleIcon.textContent = '▼';
            chatInput.focus();
        }
    });

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message');
        msgDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleChatSend() {
        const text = chatInput.value.trim();
        if (text === '') return;

        // Add user message
        addMessage(text, 'user');
        chatInput.value = '';

        // Simulate LLM delay and response
        // In a real application, you would make a fetch() request to your LLM endpoint here
        setTimeout(() => {
            addMessage("I am a simple UI demo. Connect me to an LLM endpoint to provide real answers!", 'bot');
        }, 1000);
    }

    chatSendBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });
});
