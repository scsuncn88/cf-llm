const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login'; // Login endpoint
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload'; // File upload endpoint
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat'; // Chat endpoint

document.getElementById('login-button').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  if (!username) {
    alert('Please enter a username.');
    return;
  }
  // 处理登录逻辑，例如发送请求到 API_LOGIN_URL
});