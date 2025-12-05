import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Sparkles, Brain, Loader2 } from 'lucide-react';
import { Message, UserSettings } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatWindowProps {
  settings: UserSettings;
  onToggleThinking: () => void;
  onOpenVeo: (image: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ settings, onToggleThinking, onOpenVeo }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am Gemini. You can chat with me, toggle "Deep Think" for complex logic, or use the attachment icon to animate photos with Veo.',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
      isThinking: settings.useDeepThinking
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Convert current messages to history format
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendMessageToGemini(userMsg.text, settings, history);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        isThinking: settings.useDeepThinking
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Strip prefix for API but keep for preview
        const base64Data = base64.split(',')[1];
        onOpenVeo(base64Data);
      };
      reader.readAsDataURL(file);
    }
    // Reset
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-whatsapp-dark text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Gemini Assistant</h1>
            <p className="text-xs text-white/80">
                {settings.useDeepThinking ? 'Thinking Mode (Gemini 3 Pro)' : 'Fast Mode (Gemini 2.5 Flash)'}
            </p>
          </div>
        </div>
        <button 
          onClick={onToggleThinking}
          className={`p-2 rounded-full transition-all ${settings.useDeepThinking ? 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'bg-white/10 hover:bg-white/20'}`}
          title="Toggle Deep Thinking"
        >
          <Brain size={20} className={settings.useDeepThinking ? 'text-white' : 'text-white/80'} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 chat-bg relative">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 shadow-sm relative ${
                  msg.role === 'user'
                    ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.isThinking && msg.role === 'model' && (
                    <div className="mb-2 flex items-center gap-1 text-xs text-purple-600 font-medium">
                        <Brain size={12} />
                        <span>Deep Thought</span>
                    </div>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                <span className="text-[10px] text-gray-500 block text-right mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-4 shadow-sm rounded-tl-none flex items-center gap-2">
                <Loader2 className="animate-spin text-whatsapp" size={20} />
                <span className="text-sm text-gray-500">
                    {settings.useDeepThinking ? 'Thinking deeply...' : 'Typing...'}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-whatsapp-sidebar p-2 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*"
             onChange={handleFileSelect}
           />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-gray-700 transition-colors mb-1"
            title="Upload image for Veo Video"
          >
            <ImageIcon size={24} />
          </button>
          
          <div className="flex-1 bg-white rounded-2xl flex items-center px-4 py-2 shadow-sm border border-gray-100">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none max-h-32 text-gray-800 placeholder-gray-400 py-2"
              rows={1}
              style={{ minHeight: '44px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className={`p-3 rounded-full mb-1 transition-colors shadow-sm flex items-center justify-center ${
              !inputText.trim() 
                ? 'bg-gray-200 text-gray-400' 
                : 'bg-whatsapp hover:bg-whatsapp-dark text-white'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};