const API_LOGIN_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/login'; // Login endpoint
const API_UPLOAD_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload'; // File upload endpoint
const API_CHAT_URL = 'https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat'; // Chat endpoint

const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginButton = document.getElementById('login-button');
const sendButton = document.getElementById('send-button');
const toggleStreamButton = document.getElementById('toggle-stream');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');

let apiKey = null;
let isStreamMode = false; // Default non-stream mode

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
      authContainer.style.display = 'none'; // Hide login interface
      chatContainer.style.display = 'flex'; // Show chat interface
      sendButton.disabled = false;
    } else {
      alert(data.error || 'Login failed.');
    }
  } catch (error) {
    alert('Unable to connect to the server.');
    console.error('Login error:', error);
  }
});

// Toggle stream mode
toggleStreamButton.addEventListener('click', () => {
  isStreamMode = !isStreamMode;
  toggleStreamButton.textContent = isStreamMode ? 'Disable Stream Mode' : 'Enable Stream Mode';
  toggleStreamButton.classList.toggle('active', isStreamMode);
});

// 添加触觉反馈
function triggerHapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    switch(type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([30, 50, 30]);
        break;
    }
  }
}

// Send message logic
sendButton.addEventListener('click', async () => {
  triggerHapticFeedback('medium');
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage(message, 'user');
  messageInput.value = '';
  sendButton.disabled = true;

  try {
    const response = await fetch(API_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        type: isStreamMode ? 'stream' : 'chat', 
        message, 
        userId: 'user123' 
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    if (isStreamMode) {
      // 创建一个临时的消息容器用于流式更新
      const streamContainer = document.createElement('div');
      streamContainer.className = 'message ai';
      chatBox.appendChild(streamContainer);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              streamText += data.response || '';
              streamContainer.innerHTML = marked.parse(streamText);
              
              // 滚动到最新消息
              chatBox.scrollTop = chatBox.scrollHeight;
              
              // 高亮代码块
              streamContainer.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
              });
            } catch (e) {
              console.error('Failed to parse streaming data:', e);
            }
          }
        }
      }
    } else {
      const data = await response.json();
      appendMessage(data.response || 'No response from AI.', 'ai');
    }
  } catch (error) {
    appendMessage(`Error: ${error.message}`, 'ai');
    console.error('Chat error:', error);
  } finally {
    sendButton.disabled = false;
  }
});

// Handle file upload
fileInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  for (const file of files) {
    try {
      // 显示上传进度消息
      appendMessage(`Uploading: ${file.name}`, 'user');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 显示AI的分析结果
      appendMessage(result.analysis || 'File processed successfully.', 'ai');
      
      // 触发触觉反馈
      triggerHapticFeedback('light');
      
    } catch (error) {
      appendMessage(`Error uploading ${file.name}: ${error.message}`, 'ai');
      console.error('Upload error:', error);
    }
  }
  
  // 清空文件选择，允许重复选择同一文件
  event.target.value = '';
});

async function handleStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ''; // 用于缓存解码后的数据
  let isDone = false; // 标记流式响应是否结束

  while (!isDone) {
    const { done, value } = await reader.read();
    if (done) {
      isDone = true;
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // 逐行处理
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 保留未完整的一行

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const event = line.slice(7).trim();
        if (event === 'done') {
          isDone = true;
          break;
        }
      } else if (line.startsWith('data: ')) {
        const json = line.slice(6).trim(); // 去掉 'data: ' 前缀
        try {
          const parsed = JSON.parse(json);
          appendMessage(parsed.response || 'No response received.', 'ai');
        } catch (error) {
          console.error('Failed to parse SSE JSON:', error, json);
          appendMessage(`Error: Failed to parse SSE JSON. Details: ${error.message}`, 'ai');
        }
      }
    }
  }
}

// 初始化 marked 配置
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

function appendMessage(content, className) {
  const message = document.createElement('div');
  message.className = `message ${className}`;
  // 使用 marked 解析 Markdown
  message.innerHTML = marked.parse(content);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;

  // 高亮代码块
  message.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block);
  });
}

// 添加语音输入按钮
const speechButton = document.createElement('button');
speechButton.id = 'speech-button';
speechButton.className = 'action-button';
speechButton.innerHTML = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="2"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 18.5V23" stroke="currentColor" stroke-width="2"/>
  </svg>
`;

// 将语音按钮添加到输入区域
document.querySelector('.input-container').insertBefore(
  speechButton,
  document.getElementById('send-button')
);

// 语音识别功能
let recognition = null;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN'; // 设置语言

  recognition.onstart = () => {
    speechButton.classList.add('recording');
    messageInput.placeholder = '正在听...';
    triggerHapticFeedback('medium');
  };

  recognition.onend = () => {
    speechButton.classList.remove('recording');
    messageInput.placeholder = 'Type your message...';
    triggerHapticFeedback('light');
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');
    
    messageInput.value = transcript;
    messageInput.focus();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    messageInput.placeholder = 'Speech recognition error...';
    setTimeout(() => {
      messageInput.placeholder = 'Type your message...';
    }, 2000);
  };

  // 语音按钮点击事件
  speechButton.addEventListener('click', () => {
    if (speechButton.classList.contains('recording')) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
}