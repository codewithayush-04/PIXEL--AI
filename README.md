# PIXEL-AI - ChatGPT Clone

A modern AI Chatbot built using React.js (with Vite) that mimics the UI and functionality of ChatGPT.
It supports real-time messaging, file/image uploads, and dark/light mode, with an interactive and responsive interface.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PIXEL-AI
   ``` 

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Get your Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Add your API key to the `.env` file:
     ```
     VITE_GOOGLE_AI_API_KEY=your_actual_api_key_here
     ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

⸻

🚀 Features
	•	🧠 AI-Powered Responses (using Google Gemini 2.5 Flash API)
	•	💬 Chat Interface with message bubbles for user and bot
	•	🌗 Dark / Light Theme Toggle
	•	📎 File and Image Upload Support
	•	🧹 Clear Chat / New Chat Button
	•	🕒 Chat History Sidebar
	•	⚡ Built with React + Vite for fast performance
	•	📱 Responsive Design (works on desktop & mobile)

TECH STACK
 Technology  Purpose
React.js (Vite)
Frontend framework
Lucide React Icons
UI icons
Tailwind CSS
Styling
Framer Motion
Animations
Google Gemini 2.5 Flash API
AI responses
ShadCN UI components (cards, buttons, inputs)

PROJECT STRUCTURE
chatbot/
│
├── src/
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── Sidebar.jsx
│   │   └── InputBox.jsx
│   ├── assets/
│   │   └── (images, logos)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/
│   └── favicon.ico
│
├── .env
├── package.json
├── vite.config.js
└── README.md


🧩 Future Enhancements
	•	🔊 Voice input/output (speech recognition)
	•	💾 Persistent chat history (local storage or database)
	•	🌍 Multilingual support
	•	🤖 AI persona customization

