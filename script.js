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

    notesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const patientName = document.getElementById('patient-name').value;
        const patientNotes = document.getElementById('patient-notes').value;
        const submitBtn = notesForm.querySelector('button[type="submit"]');
        
        // UI Feedback
        submitBtn.textContent = 'Processing with AI-1...';
        submitBtn.disabled = true;
        const resultContainer = document.getElementById('formatted-result-container');
        if (resultContainer) resultContainer.classList.add('hidden');
        
        try {
            const response = await fetch('http://localhost:3000/api/notes/format', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientName, rawNotes: patientNotes })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log("Success! AI-1 Formatted Data:", data.formatted);
                submitSuccess.textContent = 'Notes formatted securely!';
                submitSuccess.style.color = '#27ae60';
                
                // Display the output directly on the webpage
                document.getElementById('formatted-result').textContent = data.formatted;
                document.getElementById('formatted-result-container').classList.remove('hidden');
                
                notesForm.reset();
            } else {
                throw new Error(data.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error submitting notes:", error);
            submitSuccess.textContent = 'Error formatting notes: ' + error.message;
            submitSuccess.style.color = 'red';
        }
        
        submitSuccess.classList.remove('hidden');
        submitBtn.textContent = 'Submit Notes';
        submitBtn.disabled = false;
        
        setTimeout(() => {
            submitSuccess.classList.add('hidden');
        }, 5000);
    });

    // --- Chatbot Logic ---
    const chatbotHeader = document.getElementById('chatbot-header');
    const chatbotBody = document.getElementById('chatbot-body');
    const chatbotToggleIcon = document.getElementById('chatbot-toggle-icon');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    const chatbotContainer = document.getElementById('chatbot-container');

    chatbotHeader.addEventListener('click', () => {
        chatbotBody.classList.toggle('hidden');
        chatbotContainer.classList.toggle('chatbot-minimized');
        if (chatbotBody.classList.contains('hidden')) {
            chatbotToggleIcon.textContent = '💬';
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

    async function handleChatSend() {
        const text = chatInput.value.trim();
        if (text === '') return;

        // Add user message
        addMessage(text, 'user');
        chatInput.value = '';

        // Add a temporary loading message
        const loadingMsgId = Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot-message');
        loadingDiv.id = `msg-${loadingMsgId}`;
        loadingDiv.textContent = "...";
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Send request to our new backend endpoint
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });
            
            const data = await response.json();
            
            // Replace loading message with actual response
            const msgEl = document.getElementById(`msg-${loadingMsgId}`);
            if (msgEl) {
                msgEl.textContent = data.reply || "Error: No reply received.";
            }
        } catch (error) {
            console.error("Chat error:", error);
            const msgEl = document.getElementById(`msg-${loadingMsgId}`);
            if (msgEl) {
                msgEl.textContent = "Sorry, I couldn't connect to the server.";
            }
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSendBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });
});
