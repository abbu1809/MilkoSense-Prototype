// MilkoSense Theme and Chatbot Component
// Handles Dark/Light mode toggle and MilkoBot chatbot

// Dark Mode Toggle - Enhanced with better visibility
function initializeThemeToggle() {
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateTheme(currentTheme);

    // Create theme toggle button - More visible design
    const nav = document.querySelector('nav .max-w-7xl');
    if (nav) {
        // Remove existing toggle if present
        const existingToggle = document.getElementById('theme-toggle');
        if (existingToggle) existingToggle.remove();
        
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all duration-300 font-medium text-sm';
        themeToggle.setAttribute('title', currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        themeToggle.innerHTML = currentTheme === 'dark' 
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span>Light</span>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg><span>Dark</span>';
        
        themeToggle.addEventListener('click', toggleTheme);
        
        // Insert in navigation - make it more visible
        const navLinks = nav.querySelector('.hidden.md\\:flex');
        if (navLinks) {
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'flex items-center';
            toggleContainer.appendChild(themeToggle);
            navLinks.appendChild(toggleContainer);
        } else {
            // Fallback: insert before mobile menu button
            const mobileMenuBtn = nav.querySelector('button.md\\:hidden');
            if (mobileMenuBtn) {
                nav.insertBefore(themeToggle, mobileMenuBtn);
            } else {
                nav.appendChild(themeToggle);
            }
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateTheme(newTheme);
}

function updateTheme(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        themeToggle.innerHTML = theme === 'dark'
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span>Light</span>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg><span>Dark</span>';
    }
}

// MilkoBot Chatbot - Enhanced with AI analysis integration
function initializeMilkoBot() {
    // Create chatbot container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'milko-bot-container';
    chatbotContainer.innerHTML = `
        <!-- Chat Bubble -->
        <button id="chatbot-toggle" class="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-40 flex items-center justify-center group">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <span class="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white pulse-animation"></span>
            <span class="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Ask MilkoBot
            </span>
        </button>

        <!-- Chat Window -->
        <div id="chatbot-window" class="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 hidden flex flex-col border border-gray-200 dark:border-gray-700">
            <!-- Chat Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-bold">Ask MilkoBot</h3>
                        <p class="text-xs text-blue-100">AI Assistant</p>
                    </div>
                </div>
                <button id="chatbot-close" class="text-white hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Chat Messages -->
            <div id="chatbot-messages" class="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-gray-800">
                <div class="flex items-start space-x-2">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <div class="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                        <p class="text-sm text-gray-800">Hello! I'm MilkoBot, your AI assistant for milk quality analysis. How can I help you today?</p>
                    </div>
                </div>
            </div>

            <!-- Quick Questions -->
            <div id="quick-questions" class="px-4 pb-2 space-y-2">
                <div class="text-xs text-gray-500 font-medium mb-2">Quick Questions:</div>
                <div class="flex flex-wrap gap-2">
                    <button class="quick-question-btn text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors" data-question="How to improve pH?">
                        How to improve pH?
                    </button>
                    <button class="quick-question-btn text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors" data-question="Why turbidity is high?">
                        Why turbidity is high?
                    </button>
                    <button class="quick-question-btn text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors" data-question="How season affects quality?">
                        How season affects quality?
                    </button>
                </div>
            </div>

            <!-- Chat Input -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex space-x-2">
                    <input type="text" id="chatbot-input" placeholder="Type your question..." 
                           class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400">
                    <button id="chatbot-send" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(chatbotContainer);
    
    // Chatbot functionality
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const quickQuestionBtns = document.querySelectorAll('.quick-question-btn');

    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
        if (!chatbotWindow.classList.contains('hidden')) {
            chatbotInput.focus();
        }
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });

    function sendMessage(message) {
        if (!message.trim()) return;

        // Add user message
        addMessage(message, 'user');
        chatbotInput.value = '';

        // Simulate bot response
        setTimeout(() => {
            const response = getBotResponse(message);
            addMessage(response, 'bot');
        }, 1000);
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start space-x-2 ${sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`;
        
        const avatar = sender === 'user' 
            ? '<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>'
            : '<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div>';
        
        const bgColor = sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        
        messageDiv.innerHTML = `
            ${avatar}
            <div class="${bgColor} rounded-lg p-3 max-w-[80%]">
                <p class="text-sm">${text}</p>
            </div>
        `;
        
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function getBotResponse(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('ph') || lowerQuestion.includes('improve ph')) {
            return 'To improve pH levels, ensure proper feed quality with balanced minerals. Avoid acidic feed and maintain clean milking conditions. pH should ideally be between 6.4-6.8 for fresh milk.';
        } else if (lowerQuestion.includes('turbidity') || lowerQuestion.includes('high turbidity')) {
            return 'High turbidity can indicate contamination or suspended particles. Ensure proper filtration, clean milking equipment, and avoid water adulteration. Normal turbidity ranges from 10-20 NTU.';
        } else if (lowerQuestion.includes('season') || lowerQuestion.includes('quality')) {
            return 'Seasonal factors significantly affect milk quality. Summer requires strict temperature control, winter is generally favorable, and rainy season needs humidity management. Each season has different feed availability and environmental conditions.';
        } else if (lowerQuestion.includes('temperature')) {
            return 'Maintain milk temperature between 15-20°C during milking and store immediately at 4°C or below. Temperature control is crucial for preventing bacterial growth and maintaining quality.';
        } else if (lowerQuestion.includes('tds')) {
            return 'TDS (Total Dissolved Solids) should be between 800-1200 ppm for quality milk. Low TDS may indicate water adulteration, while very high TDS could suggest mineral imbalance.';
        } else if (lowerQuestion.includes('adulteration') || lowerQuestion.includes('adulterant')) {
            return 'Common adulterants include urea, detergent, starch, soda, and formalin. Our colorimetric detection system can identify these. Always test milk before consumption and ensure proper quality checks.';
        } else if (lowerQuestion.includes('ai') || lowerQuestion.includes('model') || lowerQuestion.includes('analysis')) {
            return 'Our AI uses Random Forest algorithm with 99.2% accuracy. It analyzes pH, temperature, turbidity, TDS, and gas sensors along with cattle type and season to provide comprehensive quality assessment.';
        } else if (lowerQuestion.includes('grade') || lowerQuestion.includes('quality grade')) {
            return 'Quality grades are: Grade A (90-100 points) - Excellent, Grade B (75-89) - Good, Grade C (60-74) - Fair, Grade D (<60) - Poor. Our AI model calculates scores based on all sensor parameters.';
        } else if (lowerQuestion.includes('recommendation') || lowerQuestion.includes('improve')) {
            return 'To improve milk quality: 1) Optimize cattle diet with proper protein and minerals, 2) Maintain ideal temperature (15-20°C), 3) Ensure proper milking hygiene, 4) Monitor parameters regularly. Check the Recommendations page for detailed AI-generated suggestions.';
        } else {
            return 'I can help you with questions about pH levels, turbidity, temperature, TDS, seasonal factors, AI analysis, quality grades, and milk quality improvement. Feel free to ask me anything about milk quality analysis!';
        }
    }

    chatbotSend.addEventListener('click', () => {
        sendMessage(chatbotInput.value);
    });

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(chatbotInput.value);
        }
    });

    quickQuestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sendMessage(btn.dataset.question);
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeThemeToggle();
    initializeMilkoBot();
});

