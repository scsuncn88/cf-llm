// API endpoints
const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login';
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload';
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat';

// Global variables
let apiKey = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const loginForm = document.getElementById('login-form');
    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }

            try {
                console.log('Sending login request...');
                const response = await fetch(API_LOGIN_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                console.log('Response:', data);

                if (response.ok && data.apiKey) {
                    console.log('Login successful');
                    apiKey = data.apiKey;
                    authContainer.style.display = 'none';
                    chatContainer.style.display = 'flex';
                    sendButton.disabled = false;
                } else {
                    console.log('Login failed:', data.error);
                    alert(data.error || 'Login failed.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Unable to connect to the server.');
            }
        });
    } else {
        console.error('Login form not found in the DOM');
    }
});