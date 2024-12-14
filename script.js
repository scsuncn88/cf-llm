const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login'; // Login endpoint
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload'; // File upload endpoint
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat'; // Chat endpoint

document.getElementById('login-button').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim(); // 获取密码

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
    console.log('Response:', data); // 添加日志查看响应内容
  
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