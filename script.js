// API endpoints
const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login';
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload';
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat';

// Global variables
let apiKey = null;
let isStreamMode = false; // Default non-stream mode

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
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

    // Login logic
    loginButton.addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch(API_LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok && data.apiKey) {
                apiKey = data.apiKey;
                authContainer.style.display = 'none';
                chatContainer.style.display = 'flex';
                sendButton.disabled = false;
            } else {
                alert(data.error || 'Login failed.');
            }
        } catch (error) {
            alert('Unable to connect to the server.');
            console.error('Login error:', error);
        }
    });
});