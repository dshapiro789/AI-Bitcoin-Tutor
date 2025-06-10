import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Bot, Key, Crown, CheckCircle, 
  Calendar, AlertTriangle, ArrowRight, X, Menu,
  Search, Filter, Settings, Send, RefreshCw, Brain,
  Sparkles, Clock, Download, Mic, MicOff, ChevronDown,
  ChevronUp, Trash2, MessageSquare, Volume2, VolumeX,
  Save, Upload, History, FileText, Plus
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
    currentThoughts,
    clearChatHistory,
    exportChatHistory,
    saveUserModelSettings,
    addCustomModel,
    deleteCustomModel
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  
  // New model form state
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelProvider, setNewModelProvider] = useState('');
  const [newModelApiKey, setNewModelApiKey] = useState('');
  const [newModelApiEndpoint, setNewModelApiEndpoint] = useState('');
  const [newModelContextLength, setNewModelContextLength] = useState(4096);
  const [newModelTemperature, setNewModelTemperature] = useState(0.7);
  const [newModelMaxTokens, setNewModelMaxTokens] = useState(1000);
  
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

  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setShowClearConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear chat history');
    }
  };

  const handleDeleteModel = (modelId: string) => {
    setModelToDelete(modelId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteModel = async () => {
    if (!modelToDelete) return;

    try {
      await deleteCustomModel(modelToDelete);
      setShowDeleteConfirm(false);
      setModelToDelete(null);
      setError('Model deleted successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    }
  };

  const handleSaveModelSettings = async () => {
    if (!user) {
      setError('Please sign in to save model settings');
      return;
    }

    try {
      // Save all models with user-specific settings
      for (const model of models) {
        if (model.apiKeyRequired && model.apiKey) {
          await saveUserModelSettings(model);
        }
      }
      
      setError('Settings saved successfully!');
      
      // Auto-close settings menu after 1.5 seconds
      setTimeout(() => {
        setShowSettings(false);
        setError(null);
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save model settings');
    }
  };

  const handleAddCustomModel = async () => {
    if (!user) {
      setError('Please sign in to add custom models');
      return;
    }

    if (!newModelId.trim() || !newModelName.trim() || !newModelProvider.trim()) {
      setError('Please fill in all required fields (Model ID, Name, Provider)');
      return;
    }

    try {
      const customModel = {
        id: newModelId,
        name: newModelName,
        provider: newModelProvider,
        apiKeyRequired: true,
        apiKey: newModelApiKey,
        apiEndpoint: newModelApiEndpoint || 'https://api.openai.com/v1',
        active: false,
        contextLength: newModelContextLength,
        temperature: newModelTemperature,
        maxTokens: newModelMaxTokens
      };

      await addCustomModel(customModel);
      
      // Clear form
      setNewModelId('');
      setNewModelName('');
      setNewModelProvider('');
      setNewModelApiKey('');
      setNewModelApiEndpoint('');
      setNewModelContextLength(4096);
      setNewModelTemperature(0.7);
      setNewModelMaxTokens(1000);
      setShowAddModel(false);
      
      setError('Custom model added successfully!');
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add custom model');
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

  // Check if a model is the default model (cannot be deleted)
  const isDefaultModel = (modelId: string) => {
    return modelId === 'deepseek/deepseek-chat-v3-0324:free';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b shadow-sm flex-shrink-0"
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
            className="border-b bg-white overflow-y-auto flex-shrink-0"
          >
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Model Settings</h3>
                
                {/* Action Buttons - Modern Black Design */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                  {user && (
                    <>
                      <button
                        onClick={handleSaveModelSettings}
                        className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </button>
                      <button
                        onClick={exportChatHistory}
                        className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Chat
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear History
                      </button>
                    </>
                  )}
                  {isLoading && (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Add Custom Model Section */}
              {user && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">Add Custom Model</h4>
                    <button
                      onClick={() => setShowAddModel(!showAddModel)}
                      className="flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {showAddModel ? 'Cancel' : 'Add Model'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddModel && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Model ID *
                            </label>
                            <input
                              type="text"
                              value={newModelId}
                              onChange={(e) => setNewModelId(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="e.g., gpt-4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Model Name *
                            </label>
                            <input
                              type="text"
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="e.g., GPT-4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Provider *
                            </label>
                            <input
                              type="text"
                              value={newModelProvider}
                              onChange={(e) => setNewModelProvider(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="e.g., OpenAI"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              API Endpoint
                            </label>
                            <input
                              type="text"
                              value={newModelApiEndpoint}
                              onChange={(e) => setNewModelApiEndpoint(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="https://api.openai.com/v1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={newModelApiKey}
                            onChange={(e) => setNewModelApiKey(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter your API key"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Context Length
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newModelContextLength}
                              onChange={(e) => setNewModelContextLength(parseInt(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperature
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              value={newModelTemperature}
                              onChange={(e) => setNewModelTemperature(parseFloat(e.target.value))}
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
                              value={newModelMaxTokens}
                              onChange={(e) => setNewModelMaxTokens(parseInt(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleAddCustomModel}
                          className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                        >
                          Add Custom Model
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

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
                        {!model.apiKeyRequired && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{model.provider}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateModel(model.id, { ...model, active: true })}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] ${
                          model.active
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {model.active ? 'Active' : 'Use Model'}
                      </button>
                      {/* Delete button - only show for non-default models */}
                      {!isDefaultModel(model.id) && user && (
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete model"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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

                          {model.apiEndpoint && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                API Endpoint
                              </label>
                              <input
                                type="text"
                                value={model.apiEndpoint || ''}
                                onChange={(e) => updateModel(model.id, { ...model, apiEndpoint: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="API endpoint URL"
                              />
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

      {/* Messages Container - This is now the scrollable area */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-orange-50 overflow-y-auto p-4 space-y-4">
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

        {/* Enhanced Thinking Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg max-w-[85%] space-y-4">
              <div className="flex items-center text-gray-600 space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="h-6 w-6 text-orange-500" />
                </motion.div>
                <span className="text-lg font-medium">AI is thinking...</span>
              </div>
              
              {currentThoughts && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-orange-400 rounded-full"
                    />
                    <span className="text-sm font-medium text-orange-600">Current Process</span>
                  </div>
                  <div className="text-base text-gray-600 italic border-l-3 border-orange-200 pl-4 bg-orange-50 p-3 rounded-r-lg">
                    <motion.span
                      key={currentThoughts}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentThoughts}
                    </motion.span>
                  </div>
                </motion.div>
              )}
              
              {/* Progress dots */}
              <div className="flex items-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-2 h-2 bg-orange-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <div className={`p-4 rounded-xl max-w-[85%] flex items-center shadow-lg border ${
              error.includes('successfully') 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {error.includes('successfully') ? (
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              )}
              <span className="text-base">{error}</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section - Fixed at bottom */}
      <div className="border-t bg-white p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
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

            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className={`p-3 rounded-xl transition-colors ${
                showSearch 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Search className="h-5 w-5" />
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
              className={`w-full px-4 py-3 text-base border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md ${
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

          <div className="flex items-center space-x-2">
            {!isPremium && (
              <div className="hidden sm:flex items-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{remainingMessages} left</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || !input.trim() || isListening}
              className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md"
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

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Clear Chat History</h3>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4 text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-gray-600">
                Are you sure you want to clear your entire chat history? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Clear History
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Model Confirmation Modal */}
      {showDeleteConfirm && modelToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Delete Model</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setModelToDelete(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4 text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-gray-600">
                Are you sure you want to delete this custom model? This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Model:</strong> {models.find(m => m.id === modelToDelete)?.name}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setModelToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteModel}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Model
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AiChat;