export default {
  async fetch(request, env) {
    console.log('[INFO] Fetch handler triggered', { method: request.method, url: request.url });

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    if (request.method === 'POST') {
      const url = new URL(request.url);
      console.log('[INFO] POST request detected', { pathname: url.pathname });
    
      // Login endpoint
      if (url.pathname === '/login') {
        return handleLogin(request, env);
      }

      // Handle chat requests
      if (url.pathname === '/chat') {
        return handleChat(request, env);
      }

      // File upload endpoint
      if (url.pathname === '/upload') {
        return handleFileUpload(request, env);
      }

      // Retrieve chat history endpoint
      if (url.pathname === '/history') {
        return handleHistory(request, env);
      }
    }

    console.warn('[WARN] Unhandled request', { method: request.method, url: request.url });

    // Default response for non-matching requests
    return addCORSHeaders(
      new Response('Welcome to Cloudflare LLM API!', {
        headers: { 'Content-Type': 'text/plain' }
      })
    );
  }
};

function addCORSHeaders(response) {
  console.log('[INFO] Adding CORS headers');
  // Add necessary CORS headers to the response
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function handleOptions() {
  console.log('[INFO] Handling OPTIONS request');
  // Handle preflight OPTIONS requests
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    }
  });
}

async function handleLogin(request, env) {
  try {
    console.log('[INFO] Handling login request');
    // Parse and validate login credentials
    const { username, password } = await request.json();
    console.log('[DEBUG] Login payload', { username });

    if (!username || !password) {
      console.warn('[WARN] Missing login credentials');
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Username and Password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Verify credentials against environment variables
    if (username === env.USERNAME && password === env.PASSWORD) {
      console.log('[INFO] Login successful');
      return addCORSHeaders(
        new Response(
          JSON.stringify({ apiKey: env.API_KEY }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    console.warn('[WARN] Invalid credentials');
    // Invalid credentials response
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );
  } catch (err) {
    console.error('[ERROR] Login handler failed', err);
    // Internal server error handling
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Internal Server Error', details: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
}

async function handleBatchChat(env, message) {
  console.log('[INFO] Handling batch chat', { message });

  // Prepare batch chat input
  const chatInput = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: message }
    ]
  };

  try {
    // Invoke LLaMA model for batch response
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', chatInput);
    const content = extractContent(response);

    console.log('[INFO] Batch chat response received');
    return addCORSHeaders(
      new Response(
        JSON.stringify({
          success: true,
          type: 'chat',
          message,
          response: content
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  } catch (err) {
    console.error('[ERROR] Batch chat failed', err);
    // Handle batch chat errors
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Chat failed', details: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
}


async function handleChat(request, env) {
  try {
    console.log('[INFO] Handling chat request');
    // Ensure KV Namespace is available
    if (!env.CHAT_CONTEXT) {
      console.error('[ERROR] CHAT_CONTEXT is undefined or not bound. Check KV binding configuration.');
      console.log('[DEBUG] Environment:', { env });
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Server configuration error: KV namespace CHAT_CONTEXT not found' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Validate Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[WARN] Missing or invalid Authorization header');
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Verify API key
    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== env.API_KEY) {
      console.warn('[WARN] Invalid API key');
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Invalid API Key' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Parse and validate chat request payload
    const body = await request.json();
    const { type, message, userId } = body;
    console.log('[DEBUG] Chat payload received', { type, message, userId });

    if (!type || !message || !userId) {
      console.warn('[WARN] Missing required fields', { type, message, userId });
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Type, Message, and userId are required', received: body }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    // Save chat history to KV
    const historyKey = `chat-history:${userId}`;
    const previousHistory = await env.CHAT_CONTEXT.get(historyKey, { type: 'json' }) || [];
    if (!Array.isArray(previousHistory)) {
      console.warn('[WARN] Retrieved chat history is not an array. Initializing empty history.');
    }

    const updatedHistory = [
      ...(Array.isArray(previousHistory) ? previousHistory : []),
      { type, message, timestamp: Date.now() }
    ];
    await env.CHAT_CONTEXT.put(historyKey, JSON.stringify(updatedHistory));
    console.log('[INFO] Chat history updated for userId:', userId);


    // Handle specific chat types
    if (type === 'stream') {
      return await handleStreamingChat(env, message);
    } else if (type === 'chat') {
      return await handleBatchChat(env, message);
    } else {
      console.warn('[WARN] Invalid chat type specified', { type });
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Invalid type specified' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }
  } catch (err) {
    console.error('[ERROR] Chat handler failed', {
      url: request.url,
      method: request.method,
      error: err.message,
      stack: err.stack
    });
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Internal Server Error', details: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
}

async function handleHistory(request, env) {
  try {
    console.log('[INFO] Handling history request');
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[WARN] Missing or invalid Authorization header');
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== env.API_KEY) {
      console.warn('[WARN] Invalid API key');
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Invalid API Key' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const { userId } = await request.json();
    if (!userId || typeof userId !== 'string' || userId.trim() === '' || userId.length > 50) {
      console.warn('[WARN] Invalid or missing userId', { userId });
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Invalid or missing userId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    let chatHistory = await env.CHAT_CONTEXT.get(`chat-history:${userId}`, { type: 'json' });
    if (!Array.isArray(chatHistory)) {
      console.warn('[WARN] Retrieved chat history is not an array. Initializing empty history.');
      chatHistory = [];
    }

    return addCORSHeaders(
      new Response(JSON.stringify({ success: true, history: chatHistory }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (err) {
    console.error('[ERROR] History handler failed', err);
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Internal Server Error', details: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
}


async function handleFileUpload(request, env) {
  try {
    console.log('[INFO] Handling file upload request');
    // Parse uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.warn('[WARN] No file uploaded');
      return addCORSHeaders(
        new Response(JSON.stringify({ error: 'No file uploaded' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }

    // Enforce file size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.warn('[WARN] File size exceeds limit');
      return addCORSHeaders(
        new Response(JSON.stringify({ error: 'File too large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }

    // Validate MIME type
    const allowedMimeTypes = ['text/plain', 'application/json'];
    if (!file.type || !allowedMimeTypes.includes(file.type)) {
      console.warn('[WARN] Unsupported or missing file type uploaded', { fileType: file.type });
      return addCORSHeaders(
        new Response(JSON.stringify({ error: 'Unsupported or missing file type' }), {
          status: 415,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }

    console.log('[INFO] Reading file content');
    // Read file content as text
    const fileContent = await file.text();

    // Prepare input for LLaMA model
    const chatInput = {
      messages: [
        { role: 'system', content: 'Analyze the uploaded file content.' },
        { role: 'user', content: fileContent }
      ]
    };

    console.log('[DEBUG] Invoking LLaMA model', { chatInput });
    // Invoke LLaMA model and process response
    const llamaResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', chatInput);
    const content = extractContent(llamaResponse);

    console.log('[INFO] File analysis completed');
    // Return analysis result
    return addCORSHeaders(
      new Response(JSON.stringify({ success: true, analysis: content }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (err) {
    console.error('[ERROR] File upload handler failed', err);
    return addCORSHeaders(
      new Response(JSON.stringify({ error: 'File upload failed', details: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
}

async function handleStreamingChat(request, env) {
  try {
    console.log('[INFO] Handling streaming chat request');

    // 手动解析请求体
    const body = await readRequestBody(request);
    let parsedBody;

    try {
      parsedBody = JSON.parse(body);
    } catch (err) {
      console.error('[ERROR] Failed to parse request body as JSON', err);
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Invalid JSON format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const { type, message, userId } = parsedBody;

    // Validate inputs
    if (!type || !message || !userId) {
      console.warn('[WARN] Missing required fields', { type, message, userId });
      return addCORSHeaders(
        new Response(
          JSON.stringify({ error: 'Type, Message, and userId are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const chatInput = {
      messages: [
        { role: 'system', content: 'You are a friendly assistant.' },
        { role: 'user', content: message },
      ],
      stream: true,
    };

    console.log('[DEBUG] Chat input for AI:', chatInput);

    // Call AI platform
    const stream = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', chatInput);

    console.log('[INFO] Streaming response received from AI');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[ERROR] Streaming chat failed', err);

    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Streaming failed', details: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    );
  }
}

async function readRequestBody(request) {
  const chunks = [];
  const reader = request.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const bodyBuffer = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  chunks.forEach(chunk => {
    bodyBuffer.set(chunk, offset);
    offset += chunk.length;
  });

  return new TextDecoder().decode(bodyBuffer);
}


  function extractContent(response) {
    console.log('[INFO] Extracting content from LLaMA response');
    try {
      // Ensure the response object has the expected structure
      return response?.response || 'No response content available.';
    } catch (err) {
      console.error('[ERROR] Failed to extract content from response', err);
      return `Error extracting content: ${err.message}`;
    }
  }
