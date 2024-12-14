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

    if (loginForm) {
        debug('Adding submit event listener to login form');
        loginForm.addEventListener('submit', handleLogin);
        
        // Also add click event to the button as a backup
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            debug('Adding click event listener to login button');
            loginButton.addEventListener('click', handleLogin);
        }
    } else {
        console.error('Login form not found');
    }
}

// Handle login submission
async function handleLogin(e) {
    debug('Login event triggered');
    e.preventDefault();
    
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    
    if (!username || !password) {
        debug('Username or password input not found');
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
        } else {
            debug(`Login failed: ${data.error || 'Unknown error'}`);
            alert(data.error || 'Login failed.');
        }
    } catch (error) {
        console.error('Login error:', error);
        debug(`Login error: ${error.message}`);
        alert('Unable to connect to the server.');
    }
}

// Initialize chat features
function initChat() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const toggleStreamButton = document.getElementById('toggle-stream');
    const fileInput = document.getElementById('file-input');
    const cameraButton = document.getElementById('camera-button');

    // Stream mode toggle
    if (toggleStreamButton) {
        toggleStreamButton.addEventListener('click', () => {
            isStreamMode = !isStreamMode;
            toggleStreamButton.textContent = isStreamMode ? 'Disable Stream Mode' : 'Enable Stream Mode';
        });
    }

    // File upload handler
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Camera button handler
    if (cameraButton) {
        cameraButton.addEventListener('click', handleCamera);
    }

    // Message input handlers
    if (messageInput) {
        // Send on Enter (but allow Shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
            if (sendButton) {
                sendButton.disabled = !messageInput.value.trim();
            }
        });
    }

    // Send button handler
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
}

// Handle file upload
async function handleFileUpload() {
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    try {
        const response = await fetch(API_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        appendMessage(`Files uploaded successfully: ${data.fileNames.join(', ')}`, 'system');
    } catch (error) {
        console.error('Upload error:', error);
        appendMessage('Failed to upload files.', 'error');
    }

    // Clear file input
    fileInput.value = '';
}

// Handle camera
async function handleCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Create video preview and capture button
        // ... (implement camera functionality)
    } catch (error) {
        console.error('Camera error:', error);
        appendMessage('Failed to access camera.', 'error');
    }
}

// Message sending logic
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;

    // Add user message to chat
    appendMessage(message, 'user');

    try {
        if (isStreamMode) {
            await handleStreamChat(message);
        } else {
            await handleRegularChat(message);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        appendMessage('Sorry, there was an error processing your message.', 'error');
    } finally {
        sendButton.disabled = false;
    }
}

// Handle regular chat
async function handleRegularChat(message) {
    const response = await fetch(API_CHAT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            type: 'text',
            message: message,
            userId: 'user123'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to send message');
    }

    const data = await response.json();
    appendMessage(data.response, 'assistant');
}

// Handle streaming chat
async function handleStreamChat(message) {
    if (currentStreamController) {
        currentStreamController.abort();
    }

    currentStreamController = new AbortController();

    try {
        const response = await fetch(API_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                type: 'text',
                message: message,
                userId: 'user123',
                stream: true
            }),
            signal: currentStreamController.signal
        });

        if (!response.ok) {
            throw new Error('Failed to start stream');
        }

        // Create message container for streaming response
        const messageElement = document.createElement('div');
        messageElement.className = 'message assistant';
        const chatBox = document.getElementById('chat-box');
        if (chatBox) {
            chatBox.appendChild(messageElement);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            responseText += chunk;
            messageElement.innerHTML = marked.parse(responseText);
            
            // Highlight code blocks
            messageElement.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });

            if (chatBox) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Stream was cancelled');
        } else {
            throw error;
        }
    } finally {
        currentStreamController = null;
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script.js: DOMContentLoaded event fired');
    initMarked();
    initLogin();
    initChat();
});