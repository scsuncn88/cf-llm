// API endpoints
const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login';
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload';
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat';

// Global variables
let apiKey = null;
let isStreamMode = false;
let currentStreamController = null;

// Initialize Marked.js
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

// Helper function to append messages
function appendMessage(content, className) {
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
        chatBox.appendChild(messageElement);

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

            chatBox.scrollTop = chatBox.scrollHeight;
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

// Message sending logic
async function sendMessage() {
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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js: DOM fully loaded');

    // Get DOM elements
    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');
    const loginButton = document.getElementById('login-button');
    const sendButton = document.getElementById('send-button');
    const toggleStreamButton = document.getElementById('toggle-stream');
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');
    const cameraButton = document.getElementById('camera-button');

    console.log('Script.js: Got all DOM elements');
    console.log('Script.js: Login button:', loginButton);

    // Login handler
    if (loginButton) {
        loginButton.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Script.js: Login button clicked');

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            console.log('Script.js: Username length:', username.length);
            console.log('Script.js: Password length:', password.length);

            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }

            try {
                console.log('Script.js: Sending login request...');
                const response = await fetch(API_LOGIN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                console.log('Script.js: Login response:', data);

                if (response.ok && data.apiKey) {
                    console.log('Script.js: Login successful');
                    apiKey = data.apiKey;
                    authContainer.style.display = 'none';
                    chatContainer.style.display = 'flex';
                    sendButton.disabled = false;
                } else {
                    console.log('Script.js: Login failed:', data.error);
                    alert(data.error || 'Login failed.');
                }
            } catch (error) {
                console.error('Script.js: Login error:', error);
                alert('Unable to connect to the server.');
            }
        });
    }

    // Stream mode toggle
    if (toggleStreamButton) {
        toggleStreamButton.addEventListener('click', () => {
            isStreamMode = !isStreamMode;
            toggleStreamButton.textContent = isStreamMode ? 'Disable Stream Mode' : 'Enable Stream Mode';
        });
    }

    // File upload handler
    if (fileInput) {
        fileInput.addEventListener('change', async () => {
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
        });
    }

    // Camera button handler
    if (cameraButton) {
        cameraButton.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Create video preview and capture button
                // ... (implement camera functionality)
            } catch (error) {
                console.error('Camera error:', error);
                appendMessage('Failed to access camera.', 'error');
            }
        });
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
            sendButton.disabled = !messageInput.value.trim();
        });
    }

    // Send button handler
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
});