const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login'; // Login endpoint
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload'; // File upload endpoint
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat'; // Chat endpoint

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // 阻止表单的默认提交行为

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  try {
    console.log('Sending login request...'); // 添加请求前的日志
    const response = await fetch(API_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    console.log('Response:', data); // 添加响应日志

    if (response.ok && data.apiKey) {
      console.log('Login successful'); // 添加成功日志
      apiKey = data.apiKey;
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('chat-container').style.display = 'flex';
      document.getElementById('send-button').disabled = false;
    } else {
      console.log('Login failed:', data.error); // 添加失败日志
      alert(data.error || 'Login failed.');
    }
  } catch (error) {
    console.error('Login error:', error); // 添加错误日志
    alert('Unable to connect to the server.');
  }
});