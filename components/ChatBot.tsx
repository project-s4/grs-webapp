'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useChat } from '@/contexts/chat-context';

export default function ChatBot() {
  const { messages, sendMessage, isLoading } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when chat opens or is unminimized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Small delay to ensure the animation completes and input is rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isMinimized]);

  // Auto-focus input after sending a message (so user can continue typing)
  useEffect(() => {
    if (!isLoading && isOpen && !isMinimized) {
      // Focus after message is sent and loading is complete
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
    
    // Refocus input after sending message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      // Focus input when opening chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    // Focus input when unminimizing
    if (isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-error-500 hover:bg-error-600' : 'bg-primary-600 hover:bg-primary-700 chat-button-pulse'
        } text-white flex items-center justify-center`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="chat-window"
          >
            {/* Header */}
            <div className="chat-header">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">GRS Assistant</h3>
                  <p className="text-xs text-primary-100">Online • Ready to help</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {/* Messages */}
                  <div className="chat-messages">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex message-fade-in ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                        className={`w-full max-w-[16rem] sm:max-w-[20rem] rounded-2xl px-3.5 py-3 ${
                            message.role === 'user'
                              ? 'bg-primary-600 text-white shadow-lg'
                              : 'bg-white/95 dark:bg-secondary-800/90 text-gray-800 dark:text-gray-100 border border-primary-100/40 dark:border-secondary-700/60 shadow-sm'
                          }`}
                        >
                          <div className={`flex items-start space-x-2 ${
                            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              message.role === 'user'
                                ? 'bg-primary-500 text-white shadow'
                                : 'bg-primary-100 text-primary-700 dark:bg-secondary-700 dark:text-primary-100 shadow'
                            }`}>
                              {message.role === 'user' ? (
                                <User size={14} className="text-current" />
                              ) : (
                                <Bot size={14} className="text-current" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm ${
                                message.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-100'
                              }`}>
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                              <div className={`text-xs mt-1 ${
                                message.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/95 dark:bg-secondary-800/90 text-gray-800 dark:text-gray-100 border border-primary-100/40 dark:border-secondary-700/60 rounded-2xl px-4 py-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Bot size={14} className="text-primary-600 dark:text-primary-300" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 bg-white/95 dark:bg-secondary-900/85 border-t border-primary-100/40 dark:border-secondary-800">       
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="chat-input"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="chat-send-button"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Powered by AI • For grievance portal assistance
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
