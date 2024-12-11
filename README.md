# Chat AI Interface

This project provides a web-based interface to interact with an AI chatbot powered by a back-end LLM (Large Language Model). Users can log in, send messages, upload files, retrieve chat history, and toggle between standard and stream modes for responses.

## Features
- **User Authentication**: Secure login with username and password.
- **Chat Functionality**: Send text messages and receive responses from the AI.
- **Stream Mode**: Toggle between batch and stream response modes.
- **File Upload**: Upload files for AI processing.
- **Chat History Retrieval**: Retrieve previous chat history for a user.
- **Camera Support (Planned)**: Placeholder for a future feature to take photos for AI processing.

## File Structure
- `index.html`: Main front-end interface with login and chat functionalities.
- Inline CSS and JavaScript: Styles and logic are embedded for simplicity.

## Endpoints
### Authentication
- **URL**: `https://floral-hill-cdd0.yamasun001-85b.workers.dev/login`
- **Method**: POST
- **Payload**:
  ```json
  {
    "username": "<your_username>",
    "password": "<your_password>"
  }
  ```
- **Response**:
  ```json
  {
    "apiKey": "<your_api_key>"
  }
  ```

### Chat
- **URL**: `https://floral-hill-cdd0.yamasun001-85b.workers.dev/chat`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer <your_api_key>
  Content-Type: application/json
  ```
- **Payload**:
  ```json
  {
    "type": "chat",
    "message": "Hello, AI!",
    "userId": "user123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "type": "chat",
    "message": "Hello, AI!",
    "response": "Hi! How can I assist you?"
  }
  ```

### File Upload
- **URL**: `https://floral-hill-cdd0.yamasun001-85b.workers.dev/upload`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer <your_api_key>
  ```
- **Payload**:
  Multipart form data containing the file.
- **Response**:
  ```json
  {
    "analysis": "File processed successfully."
  }
  ```

### Retrieve Chat History
- **URL**: `https://floral-hill-cdd0.yamasun001-85b.workers.dev/history`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer <your_api_key>
  Content-Type: application/json
  ```
- **Payload**:
  ```json
  {
    "userId": "user123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "history": [
      { "type": "chat", "message": "Hello!", "timestamp": 1697011200000 },
      { "type": "chat", "message": "How are you?", "timestamp": 1697097600000 }
    ]
  }
  ```

## Setup
1. Clone or download this repository.
2. Host the HTML file on a web server.
3. Update the API URLs in the JavaScript section if necessary.

## Usage
1. Open the interface in a web browser.
2. Log in with your credentials to obtain an API key.
3. Interact with the chatbot, upload files, retrieve chat history, or toggle stream mode.

## Planned Enhancements
- Implement camera functionality for real-time photo input.
- Improve error handling and user experience.

## Debugging Tips
1. Check browser console logs for detailed request/response information.
2. Ensure API URLs are correctly configured and reachable.
3. Verify that the API key is included in all requests requiring authentication.
4. Review server-side logs for detailed debug information.

## License
This project is licensed under the MIT License.

