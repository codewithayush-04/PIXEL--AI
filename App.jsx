import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Moon, Sun, Menu, MessageSquare, Loader2, Trash2, Bot, ImagePlus, Paperclip, X } from 'lucide-react';

export default function ChatGPTClone() {
 
  
 const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyAVAY7_RdD2gxk-q4_JR9yIIWuuAv0P9Wc'; 
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'New Conversation', messages: [] }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const prepareContents = (msgs) => {
    const contents = [];
    for (let i = 0; i < msgs.length - 1; i++) {
      const msg = msgs[i];
      const role = msg.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }
    // Last user message
    const lastMsg = msgs[msgs.length - 1];
    const parts = [{ text: lastMsg.content || 'What is in this image?' }];
    if (lastMsg.files && lastMsg.files.length > 0) {
      lastMsg.files
        .filter(f => f.type === 'image')
        .forEach(f => {
          const base64 = f.data.split(',')[1];
          const mimeType = f.mimeType;
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64
            }
          });
        });
    }
    contents.push({
      role: 'user',
      parts
    });
    return contents;
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    if (!API_KEY || API_KEY.length < 20) {
      const errorMessage = {
        role: 'assistant',
        content: '⚠️ API key is missing or invalid. Please set your VITE_GOOGLE_AI_API_KEY environment variable with a valid Google AI API key. Get one from https://aistudio.google.com/app/apikey'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = { 
      role: 'user', 
      content: input,
      files: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
        name: f.name,
        type: f.type,
        mimeType: f.mimeType,
        data: f.data,
        size: f.size
      })) : undefined
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const contents = prepareContents(newMessages);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        throw new Error('Invalid response from API - no content generated');
      }
      
      const assistantMessage = {
        role: 'assistant',
        content: data.candidates[0].content.parts[0].text
      };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      updateConversationHistory(updatedMessages, input);
    } catch (error) {
      console.error('Error:', error);
      const fileInfo = uploadedFiles.length > 0 
        ? ` I can see you uploaded ${uploadedFiles.length} file(s).` 
        : '';
      
      let errorMessage = '';
      if (error.message.includes('API request failed')) {
        errorMessage = `❌ API Error: ${error.message}${fileInfo}`;
      } else if (error.message.includes('Invalid response')) {
        errorMessage = `⚠️ Invalid API response. Please check your API key and try again.${fileInfo}`;
      } else {
        errorMessage = `❌ Network Error: ${error.message}${fileInfo}`;
      }
      
      const demoResponse = {
        role: 'assistant',
        content: errorMessage
      };
      const updatedMessages = [...newMessages, demoResponse];
      setMessages(updatedMessages);
      updateConversationHistory(updatedMessages, input);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConversationHistory = (updatedMessages, inputText) => {
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { ...conv, messages: updatedMessages, title: inputText.slice(0, 30) + '...' }
        : conv
    ));
  };

  const handleNewChat = () => {
    const newId = Math.max(...conversations.map(c => c.id), 0) + 1;
    setConversations([...conversations, { id: newId, title: 'New Conversation', messages: [] }]);
    setActiveConversationId(newId);
    setMessages([]);
    setUploadedFiles([]);
  };

  const switchConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setActiveConversationId(convId);
      setMessages(conv.messages);
      setUploadedFiles([]);
    }
  };

  const deleteConversation = (convId) => {
    console.log('Deleting conversation:', convId); 
    
    if (conversations.length === 1) {
      // If it's the last conversation, just clear it
      setMessages([]);
      setUploadedFiles([]);
      setConversations([{ id: 1, title: 'New Conversation', messages: [] }]);
      setActiveConversationId(1);
      return;
    }
    
    // Filter out the conversation to delete
    const filtered = conversations.filter(c => c.id !== convId);
    setConversations(filtered);
    
    // If we're deleting the active conversation, switch to another one
    if (activeConversationId === convId) {
      const newActive = filtered[filtered.length - 1];
      setActiveConversationId(newActive.id);
      setMessages(newActive.messages);
      setUploadedFiles([]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const isImage = file.type.startsWith('image/');
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        type: isImage ? 'image' : 'file',
        mimeType: file.type,
        data: reader.result,
        size: file.size
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ${darkMode ? 'bg-gray-950' : 'bg-white'} border-r ${darkMode ? 'border-gray-800' : 'border-gray-200'} overflow-hidden flex flex-col`}>
        <div className={`p-4 flex items-center gap-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold"> PIXEL-AI </h2>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI Assistant</p>
          </div>
        </div>
        
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`relative group w-full text-left px-3 py-3 rounded-lg mb-1 flex items-center gap-2 transition-colors cursor-pointer ${
                activeConversationId === conv.id
                  ? darkMode ? 'bg-gray-800' : 'bg-gray-200'
                  : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              onClick={() => switchConversation(conv.id)}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="truncate text-sm flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded flex-shrink-0 ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-300 text-gray-600 hover:text-red-600'} transition-all`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">PIXEL-AI</h1>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Start a conversation by typing a message below
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : darkMode ? 'bg-gray-800' : 'bg-gray-200'
                    }`}
                  >
                    {msg.files && msg.files.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {msg.files.map((file, fileIdx) => (
                          <div key={fileIdx} className="flex items-center gap-2 text-sm">
                            {file.type === 'image' ? (
                              <img src={file.data} alt={file.name} className="max-w-full rounded-lg max-h-48" />
                            ) : (
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-700' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                                <Paperclip size={14} />
                                <span className="truncate max-w-[200px]">{file.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="mb-6 flex justify-start">
                  <div className={`px-4 py-3 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-4 py-4`}>
          <div className="max-w-3xl mx-auto">
            {/* File Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className={`relative group ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg p-2 flex items-center gap-2`}
                  >
                    {file.type === 'image' ? (
                      <img src={file.data} alt={file.name} className="h-16 w-16 object-cover rounded" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Paperclip size={16} />
                        <span className="text-sm max-w-[150px] truncate">{file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className={`absolute -top-2 -right-2 p-1 rounded-full ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-3xl px-4 py-2`}>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                title="Upload Image"
              >
                <ImagePlus size={20} />
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                title="Upload File"
              >
                <Paperclip size={20} />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message PIXEL-AI..."
                disabled={isLoading}
                className={`flex-1 bg-transparent outline-none ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
              <button
                onClick={handleSend}
                disabled={((!input.trim() && uploadedFiles.length === 0) || isLoading)}
                className={`p-2 rounded-full transition-all ${
                  (input.trim() || uploadedFiles.length > 0) && !isLoading
                    ? darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                    : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <p className={`text-xs text-center mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
             Use PIXEL AI for fast and responsive answers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
