import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Bot, Key, Crown, CheckCircle, 
  Calendar, AlertTriangle, ArrowRight, X, Menu,
  Search, Filter, Settings, Send, RefreshCw, Brain,
  Sparkles, Clock, Download, Mic, MicOff, ChevronDown,
  ChevronUp, Trash2, MessageSquare
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
    addModel,
    removeModel,
    isLoading,
    remainingMessages,
    isPremium,
    currentThoughts,
    addReaction,
    exportChatHistory,
    searchMessages
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
      handleSubmit(new Event('submit') as any);
    },
    onError: (error) => {
      console.error('Voice error:', error);
      setError('Voice input error: ' + error);
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
      startListening();
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

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <ArrowRight className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bot className="h-6 w-6 mr-2 text-orange-500" />
              AI Bitcoin Tutor
            </h1>
            {!isPremium && (
              <div className="text-sm text-gray-500">
                {remainingMessages} messages remaining
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isPremium && (
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade</span>
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-gray-100' : 'hover:bg-gray-100'
            }`}
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

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

                          {!model.apiKeyRequired && (
                            <button
                              onClick={() => removeModel(model.id)}
                              className="flex items-center text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove Model
                            </button>
                          )}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {filteredMessages.map((message) => (
          <ChatMessage
            key={message.id}
            {...message}
            remainingMessages={message.isUser ? remainingMessages : undefined}
            isPremium={isPremium}
            onReaction={addReaction}
            onQuickReply={handleQuickReply}
          />
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

      {/* Input */}
      <div className="bg-white border-t shadow-lg p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3 max-w-5xl mx-auto">
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
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-3 rounded-xl transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isPremium ? "Ask anything about Bitcoin..." : "Ask anything about Bitcoin"}
              className="w-full px-6 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow duration-200 shadow-sm hover:shadow-md"
              disabled={isProcessing}
            />
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
              disabled={isProcessing || !input.trim()}
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
      </div>
    </div>
  );
}

export default AiChat;