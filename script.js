// API endpoints
const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login';
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload';
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat';

console.log('Script started loading...'); // Debug log

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

// Debug log for DOM elements
console.log('Login button:', loginButton);
console.log('Auth container:', authContainer);
console.log('Chat container:', chatContainer);

// Global variables
let apiKey = null;
let isStreamMode = false; // Default non-stream mode

// Login logic
if (loginButton) {
    console.log('Adding click event listener to login button'); // Debug log
    loginButton.addEventListener('click', async () => {
        console.log('Login button clicked'); // Debug log
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        console.log('Username length:', username.length); // Debug log
        console.log('Password length:', password.length); // Debug log

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            console.log('Sending login request...'); // Debug log
            const response = await fetch(API_LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Login response:', data); // Debug log

            if (response.ok && data.apiKey) {
                console.log('Login successful'); // Debug log
                apiKey = data.apiKey;
                authContainer.style.display = 'none';
                chatContainer.style.display = 'flex';
                sendButton.disabled = false;
            } else {
                console.log('Login failed:', data.error); // Debug log
                alert(data.error || 'Login failed.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Unable to connect to the server.');
        }
    });
} else {
    console.error('Login button not found in the DOM'); // Debug log
}