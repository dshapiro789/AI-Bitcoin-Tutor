import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Bot, Key, Crown, CheckCircle, 
  Calendar, AlertTriangle, ArrowRight, X, Menu,
  Search, Filter, Settings, Send, RefreshCw, Brain,
  Sparkles, Clock, Download, Mic, MicOff, ChevronDown,
  ChevronUp, Trash2, MessageSquare, Volume2, VolumeX
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { ChatMessage } from '../components/ChatMessage';
import { useAIChat } from '../hooks/useAIChat';
import { useVoice } from '../hooks/useVoice';

function AiChat() {
  const {
    messages,
    isProcessing,
    error: chatError,
    models,
    sendMessage,
    updateModel,
    isLoading,
    remainingMessages,
    isPremium,
    currentThoughts
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useVoice({
    onResult: (transcript) => {
      setInput(transcript);
      // Auto-submit after voice input
      setTimeout(() => {
        if (transcript.trim()) {
          handleSubmit(new Event('submit') as any);
        }
      }, 500);
    },
    onError: (error) => {
      console.error('Voice error:', error);
      setError('Voice input error: ' + error);
      setTimeout(() => setError(null), 3000);
    },
    onStart: () => {
      setError(null);
    },
    onEnd: () => {
      // Clear any temporary error messages when voice input ends
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThoughts]);

  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const activeModel = models.find(m => m.active);
    if (!activeModel) {
      setError('Please select an AI model first');
      return;
    }

    const message = input;
    setInput('');
    setError(null);
    
    try {
      await sendMessage(message, activeModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleQuickReply = (reply: string) => {
    setInput(reply);
    handleSubmit(new Event('submit') as any);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      startListening();
    }
  };

  const handleSpeakToggle = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (searchQuery) {
      return msg.text.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (messageFilter !== 'all') {
      return msg.category === messageFilter;
    }
    return true;
  });

  // Dynamic placeholder text based on voice state
  const getPlaceholderText = () => {
    if (isListening) {
      return "🎤 Listening... Speak now!";
    }
    if (isProcessing) {
      return "Processing your message...";
    }
    return isPremium ? "Ask anything about Bitcoin..." : "Ask anything about Bitcoin (voice input available)";
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Upgrade Banner for Non-Premium Users */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Upgrade to Premium</h3>
                  <p className="text-sm opacity-90">
                    {remainingMessages} messages remaining • Get unlimited access
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/subscription')}
                className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b shadow-sm"
            >
              <div className="p-4 flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={messageFilter}
                    onChange={(e) => setMessageFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Messages</option>
                    <option value="question">Questions</option>
                    <option value="explanation">Explanations</option>
                    <option value="code">Code Examples</option>
                    <option value="error">Errors</option>
                    <option value="success">Success</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b bg-white overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Model Settings</h3>
                  {isLoading && (
                    <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                  )}
                </div>

                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`bg-white p-4 rounded-xl border transition-all ${
                      model.active ? 'border-orange-500 shadow-md' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center">
                          <Bot className="h-5 w-5 text-gray-500 mr-2" />
                          <h4 className="font-medium text-gray-900">{model.name}</h4>
                        </div>
                        <p className="text-sm text-gray-500">{model.provider}</p>
                      </div>
                      <button
                        onClick={() => updateModel(model.id, { ...model, active: true })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          model.active
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {model.active ? 'Active' : 'Use Model'}
                      </button>
                    </div>

                    {/* Advanced Settings */}
                    <div className="mt-2">
                      <button
                        onClick={() => setShowAdvanced(showAdvanced === model.id ? null : model.id)}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Advanced Settings
                        {showAdvanced === model.id ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </button>

                      <AnimatePresence>
                        {showAdvanced === model.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-4"
                          >
                            {model.apiKeyRequired && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  API Key
                                </label>
                                <div className="flex space-x-2">
                                  <input
                                    type="password"
                                    value={model.apiKey || ''}
                                    onChange={(e) => updateModel(model.id, { ...model, apiKey: e.target.value })}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Enter API key"
                                  />
                                  <button
                                    onClick={() => updateModel(model.id, { ...model, apiKey: '' })}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Temperature
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="2"
                                  step="0.1"
                                  value={model.temperature}
                                  onChange={(e) => updateModel(model.id, { ...model, temperature: parseFloat(e.target.value) })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Max Tokens
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={model.maxTokens}
                                  onChange={(e) => updateModel(model.id, { ...model, maxTokens: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Context Length
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={model.contextLength}
                                  onChange={(e) => updateModel(model.id, { ...model, contextLength: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-b-xl shadow-lg overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {filteredMessages.map((message) => (
              <div key={message.id} className="relative group">
                <ChatMessage
                  {...message}
                  remainingMessages={message.isUser ? remainingMessages : undefined}
                  isPremium={isPremium}
                  onQuickReply={handleQuickReply}
                />
                {/* Add speak button for AI messages */}
                {!message.isUser && isSupported && (
                  <button
                    onClick={() => handleSpeakToggle(message.text)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                    title={isSpeaking ? "Stop speaking" : "Read aloud"}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg max-w-[85%] space-y-3">
                  <div className="flex items-center text-gray-600 space-x-2">
                    <Brain className="h-5 w-5 text-orange-500 animate-pulse" />
                    <span className="text-lg font-medium">Thinking...</span>
                  </div>
                  {currentThoughts && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-base text-gray-500 italic border-l-2 border-orange-200 pl-4"
                    >
                      {currentThoughts}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="bg-red-50 text-red-800 p-4 rounded-xl max-w-[85%] flex items-center shadow-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-base">{error}</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t bg-gray-50 p-4">
            <form onSubmit={handleSubmit} className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-3 rounded-xl transition-colors ${
                    showSettings 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                </button>

                {isSupported && (
                  <motion.button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`p-3 rounded-xl transition-all duration-200 relative ${
                      isListening
                        ? 'bg-orange-500 text-white shadow-lg scale-110'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-5 w-5" />
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-orange-300"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      </>
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                    {isListening && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-orange-600 font-medium whitespace-nowrap">
                        Listening...
                      </span>
                    )}
                  </motion.button>
                )}
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={getPlaceholderText()}
                  className={`w-full px-6 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md ${
                    isListening 
                      ? 'border-orange-300 bg-orange-50 placeholder-orange-500' 
                      : 'border-gray-200'
                  }`}
                  disabled={isProcessing || isListening}
                />
                {isListening && (
                  <motion.div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {!isPremium && (
                  <div className="hidden sm:flex items-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{remainingMessages} messages left</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || !input.trim() || isListening}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md"
                >
                  <Send className="h-5 w-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>

            {/* Mobile message counter */}
            {!isPremium && (
              <div className="sm:hidden flex justify-center mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{remainingMessages} messages remaining</span>
                </div>
              </div>
            )}

            {/* Voice input status indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex justify-center mt-2"
                >
                  <div className="flex items-center space-x-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    <motion.div
                      className="w-2 h-2 bg-orange-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span className="text-sm font-medium">Listening for your voice...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiChat;