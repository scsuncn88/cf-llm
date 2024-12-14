// Debug function
function debug(message) {
    console.log(`[DEBUG] ${message}`);
}

// Immediate debug logs
debug('Script started');

// API endpoints
const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login';
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload';
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat';

// Global variables
let apiKey = null;
let isStreamMode = false;
let currentStreamController = null;

// Initialize Marked.js after DOM is loaded
function initMarked() {
    debug('Initializing Marked.js');
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
        debug('Marked.js initialized successfully');
    } else {
        debug('Warning: marked is not defined');
    }
}

// Helper function to append messages
function appendMessage(content, className) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) {
        debug('Warning: chat-box element not found');
        return;
    }

    const message = document.createElement('div');
    message.className = `message ${className}`;
    message.innerHTML = marked.parse(content);
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Highlight code blocks
    message.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
}

// Initialize login form
function initLogin() {
    debug('Initializing login form');
    const loginForm = document.getElementById('login-form');
    
    debug(`Login form element: ${loginForm ? 'found' : 'not found'}`);

    if (!loginForm) {
        console.error('Login form not found');
        return;
    }

    // Remove any existing event listeners
    loginForm.removeEventListener('submit', handleLogin);

    // Add event listener for form submission
    loginForm.addEventListener('submit', handleLogin);

    debug('Event listeners added successfully');
}

// Handle login submission
async function handleLogin(e) {
    debug('Login event triggered');
    e.preventDefault();
    
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    
    if (!username || !password || !loginButton) {
        debug('Form elements not found');
        return;
    }

    const usernameValue = username.value.trim();
    const passwordValue = password.value.trim();

    debug(`Username length: ${usernameValue.length}`);
    debug(`Password length: ${passwordValue.length}`);

    if (!usernameValue || !passwordValue) {
        alert('Please enter both username and password.');
        return;
    }

    // Disable login button during request
    loginButton.disabled = true;

    try {
        debug('Sending login request...');
        const response = await fetch(API_LOGIN_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                username: usernameValue, 
                password: passwordValue 
            })
        });

        debug(`Response status: ${response.status}`);
        const data = await response.json();
        debug(`Login response: ${JSON.stringify(data)}`);

        if (response.ok && data.apiKey) {
            debug('Login successful');
            apiKey = data.apiKey;
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'flex';
            document.getElementById('send-button').disabled = false;
            initChat(); // Initialize chat after successful login
            loadChatHistory(); // Load chat history after successful login
        } else {
            debug(`Login failed: ${data.error || 'Unknown error'}`);
            alert(data.error || 'Login failed.');
            loginButton.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        debug(`Login error: ${error.message}`);
        alert('Unable to connect to the server.');
        loginButton.disabled = false;
    }
}

// Initialize chat interface
function initChat() {
    debug('Initializing chat interface');
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const fileInput = document.getElementById('file-input');
    const toggleStreamButton = document.getElementById('toggle-stream');
    
    // Enable send button when message input has content
    messageInput.addEventListener('input', () => {
        sendButton.disabled = !messageInput.value.trim();
    });

    // Handle message submission
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            handleMessage(message);
            messageInput.value = '';
            sendButton.disabled = true;
        }
    });

    // Handle enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // Handle file upload
    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            await handleFileUpload(files);
            fileInput.value = ''; // Reset file input
        }
    });

    // Handle stream mode toggle
    toggleStreamButton.addEventListener('click', () => {
        isStreamMode = !isStreamMode;
        toggleStreamButton.textContent = isStreamMode ? 'Disable Stream Mode' : 'Enable Stream Mode';
    });

    debug('Chat interface initialized');
}

// Handle message sending
async function handleMessage(message) {
    debug('Handling message:', message);
    
    if (!apiKey) {
        debug('No API key available');
        alert('Please log in first.');
        return;
    }

    // Display user message
    appendMessage(message, 'user');

    try {
        if (isStreamMode) {
            await handleStreamChat(message);
        } else {
            await handleRegularChat(message);
        }
    } catch (error) {
        console.error('Chat error:', error);
        appendMessage('Error: Unable to process your message.', 'error');
    }
}

// Handle regular chat
async function handleRegularChat(message) {
    debug('Sending regular chat message');
    
    try {
        const response = await fetch(API_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        if (response.ok && data.response) {
            appendMessage(data.response, 'assistant');
        } else {
            throw new Error(data.error || 'Failed to get response');
        }
    } catch (error) {
        console.error('Regular chat error:', error);
        appendMessage('Error: ' + error.message, 'error');
    }
}

// Handle streaming chat
async function handleStreamChat(message) {
    debug('Starting streaming chat');
    
    if (!apiKey) {
        debug('No API key available');
        alert('Please log in first.');
        return;
    }

    // Create a placeholder message for streaming response
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant';
    chatBox.appendChild(messageElement);

    try {
        const response = await fetch(API_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ 
                message,
                stream: true 
            })
        });

        if (!response.ok) {
            throw new Error('Stream request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            responseText += chunk;
            
            // Update message content
            messageElement.innerHTML = marked.parse(responseText);
            
            // Highlight code blocks
            messageElement.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });

            // Scroll to bottom
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    } catch (error) {
        console.error('Streaming chat error:', error);
        messageElement.innerHTML = marked.parse('Error: ' + error.message);
        messageElement.classList.add('error');
    }
}

// Handle file upload
async function handleFileUpload(files) {
    debug('Handling file upload');
    
    if (!apiKey) {
        debug('No API key available');
        alert('Please log in first.');
        return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
        const response = await fetch(API_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (response.ok && data.message) {
            appendMessage(`Files uploaded: ${files.map(f => f.name).join(', ')}`, 'system');
            appendMessage(data.message, 'assistant');
        } else {
            throw new Error(data.error || 'Failed to upload files');
        }
    } catch (error) {
        console.error('File upload error:', error);
        appendMessage('Error uploading files: ' + error.message, 'error');
    }
}

// Load chat history
async function loadChatHistory() {
    debug('Loading chat history');
    
    if (!apiKey) {
        debug('No API key available');
        return;
    }

    try {
        const response = await fetch(`${API_CHAT_URL}/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load chat history');
        }

        const data = await response.json();
        
        if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach(msg => {
                appendMessage(msg.content, msg.role === 'user' ? 'user' : 'assistant');
            });
        }
    } catch (error) {
        console.error('History loading error:', error);
        appendMessage('Error loading chat history: ' + error.message, 'error');
    }
}

// Initialize everything
function init() {
    debug('Initializing application');
    initMarked();
    initLogin();
    debug('Initialization complete');
}

// Set up initialization
if (document.readyState === 'loading') {
    debug('Document still loading, adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', init);
} else {
    debug('Document already loaded, initializing now');
    init();
}