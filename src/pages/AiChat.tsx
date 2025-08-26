import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Key, CheckCircle, 
  Calendar, AlertTriangle, ArrowRight, X, Menu,
  Settings, Send, RefreshCw, Brain,
  Sparkles, Clock, ChevronDown,
  ChevronUp, Trash2, MessageSquare, 
  Save, Upload, History, FileText, Plus, ArrowUp,
  GraduationCap, BookOpen, Zap, Target, Award, Share2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ChatMessage } from '../components/ChatMessage';
import { ShareExportModal } from '../components/ShareExportModal';
import { ChatHistorySidebar } from '../components/ChatHistorySidebar';
import { LoadingScreen } from '../components/LoadingScreen';
import { Toast } from '../components/Toast';
import { useAIChat } from '../hooks/useAIChat';
import { useChatHistory } from '../hooks/useChatHistory';

function AiChat() {
  const {
    messages,
    isProcessing,
    error: chatError,
    models,
    sendMessage,
    updateModel,
    isLoading,
    currentThoughts,
    contextMemory,
    startNewChatSession,
    deleteAllChatHistory,
    exportChatHistory,
    saveUserModelSettings,
    addCustomModel,
    deleteCustomModel,
    showWelcomeScreen,
    setShowWelcomeScreen,
    handleKnowledgeLevelSelection,
    starterQuestions,
    loadMessagesForSession
  } = useAIChat();
  
  const { loadChatSession } = useChatHistory();
  
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showShareExportModal, setShowShareExportModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Knowledge levels with descriptions and icons
  const knowledgeLevels = [
    {
      id: 'novice',
      title: 'Novice',
      description: 'I know nothing about Bitcoin',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'from-green-400 to-green-600',
      details: 'Perfect for complete beginners. We\'ll start with the very basics and build your understanding step by step.'
    },
    {
      id: 'beginner',
      title: 'Beginner',
      description: 'I know what Bitcoin is, but not much else',
      icon: <GraduationCap className="h-8 w-8" />,
      color: 'from-blue-400 to-blue-600',
      details: 'Great for those who have heard of Bitcoin but want to understand how it works and why it matters.'
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'I know the basics about Bitcoin',
      icon: <Target className="h-8 w-8" />,
      color: 'from-orange-400 to-orange-600',
      details: 'Ideal for users who understand basic concepts and want to dive deeper into technical aspects.'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'I know a lot about Bitcoin',
      icon: <Zap className="h-8 w-8" />,
      color: 'from-purple-400 to-purple-600',
      details: 'For experienced users ready to explore complex topics, technical details, and advanced concepts.'
    },
    {
      id: 'expert',
      title: 'Expert',
      description: 'I have enough knowledge to teach others about Bitcoin',
      icon: <Award className="h-8 w-8" />,
      color: 'from-red-400 to-red-600',
      details: 'For Bitcoin experts who want to discuss cutting-edge developments and nuanced technical topics.'
    }
  ];

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  // Hide toast notification
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThoughts]);

  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);

  // Scroll event listener for showing/hiding scroll-to-top button
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const scrollTop = messagesContainer.scrollTop;
      const scrollHeight = messagesContainer.scrollHeight;
      const clientHeight = messagesContainer.clientHeight;
      
      // Show button when scrolled down more than 300px from top
      // or when there's more than 20% of content above the current view
      const scrolledFromTop = scrollTop > 300;
      const significantContentAbove = scrollTop > (scrollHeight - clientHeight) * 0.2;
      
      setShowScrollToTop(scrolledFromTop || significantContentAbove);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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

  const handleClearHistory = async () => {
    try {
      await deleteAllChatHistory();
      setShowClearConfirm(false);
      showToast('Chat history cleared successfully');
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
      showToast('Model deleted successfully');
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
      
      showToast('Settings saved successfully');
      
      // Auto-close settings menu after 1.5 seconds
      setTimeout(() => {
        setShowSettings(false);
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
      
      showToast('Custom model added successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add custom model');
    }
  };

  const handleNewChat = () => {
    startNewChatSession();
    setShowChatHistory(false);
  };

  const handleLoadChat = async (sessionId: string) => {
    try {
      const sessionMessages = await loadChatSession(sessionId);
      if (sessionMessages && sessionMessages.length > 0) {
        await loadMessagesForSession(sessionId);
        showToast('Chat loaded successfully');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    }
  };

  // Dynamic placeholder text
  const getPlaceholderText = () => {
    if (isProcessing) {
      return "Processing your message...";
    }
    return "Ask anything about Bitcoin...";
  };

  // Check if a model is the default model (cannot be deleted)
  const isDefaultModel = (modelId: string) => {
    return modelId === 'deepseek/deepseek-chat' || modelId === 'anthropic/claude-3.5-sonnet';
  };

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen message="Initializing AI Bitcoin Tutor..." />;
  }

  // Welcome Screen Component
  const WelcomeScreen = () => (
    <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full mb-6"
          >
            <Brain className="h-10 w-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to AI Bitcoin Tutor!
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            To provide you with the most relevant information, please select your current Bitcoin knowledge level:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {knowledgeLevels.map((level, index) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleKnowledgeLevelSelection(level.id)}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-left group"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${level.color} rounded-xl mb-4 text-white group-hover:scale-110 transition-transform`}>
                {level.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {level.title}
              </h3>
              
              <p className="text-gray-600 mb-3 font-medium">
                {level.description}
              </p>
              
              <p className="text-sm text-gray-500">
                {level.details}
              </p>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="inline-block p-4 bg-orange-100 rounded-lg border-2 border-orange-200 shadow-sm">
            <p className="text-orange-700 text-base font-semibold">
              💡 Don't worry - you can always change your knowledge level later in the settings.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  // If showing welcome screen, render it instead of the chat interface
  if (showWelcomeScreen) {
    return (
      <div className="flex flex-col h-full">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
      />

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
                        onClick={() => setShowWelcomeScreen(true)}
                        className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Change Knowledge Level
                      </button>
                      <button
                        onClick={handleSaveModelSettings}
                        className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </button>
                      <button
                        onClick={() => setShowShareExportModal(true)}
                        className="flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share/Export Chat
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
                              placeholder="e.g., perplexity/sonar-reasoning"
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
                              placeholder="e.g., Perplexity Sonar Reasoning"
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
                              placeholder="e.g., OpenRouter"
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
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] ${
                          model.active
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 ring-2 ring-orange-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
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
                          {model.apiKeyRequired && !isDefaultModel(model.id) && (
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

                          {model.apiEndpoint && model.apiKeyRequired && (
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

      {/* Messages Container - Now with bottom padding for mobile fixed input */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 bg-gradient-to-br from-gray-50 to-orange-50 overflow-y-auto p-4 space-y-4 pb-32 md:pb-4 relative"
      >
        {messages.map((message) => (
          <div key={message.id} className="relative group">
            <ChatMessage
              {...message}
              onQuickReply={handleQuickReply}
            />
          </div>
        ))}

        {/* Enhanced AI Thinking Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex justify-start"
          >
            <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg max-w-[85%] space-y-4 border border-gray-100">
              {/* Header with Brain Icon */}
              <div className="flex items-center text-gray-600 space-x-3">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="relative"
                >
                  <Brain className="h-6 w-6 text-orange-500" />
                  {/* Subtle glow effect */}
                  <motion.div
                    animate={{ 
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.3, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute inset-0 bg-orange-400 rounded-full blur-sm -z-10"
                  />
                </motion.div>
                <span className="text-lg font-medium">AI is thinking...</span>
              </div>
              
              {/* Current Process Display */}
              {currentThoughts && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 bg-orange-400 rounded-full"
                    />
                    <span className="text-sm font-medium text-orange-600">Current Process</span>
                  </div>
                  <div className="text-base text-gray-600 italic border-l-3 border-orange-200 pl-4 bg-orange-50 p-3 rounded-r-lg">
                    <motion.span
                      key={currentThoughts}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {currentThoughts}
                    </motion.span>
                  </div>
                </motion.div>
              )}
              
              {/* Progress Dots - Refined Animation */}
              <div className="flex items-center justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4],
                      y: [0, -4, 0]
                    }}
                    transition={{ 
                      duration: 1.8, 
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
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

        {/* Floating Scroll to Top Button - Improved positioning */}
        <AnimatePresence>
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="fixed bottom-32 right-6 md:bottom-24 md:right-6 z-50 p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-xl"
              title="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input Section - Fixed at bottom on mobile, normal on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto md:left-auto md:right-auto border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowChatHistory(!showChatHistory)}
              className={`p-3 rounded-xl transition-colors ${
                showChatHistory 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="View Chat History"
            >
              <History className="h-5 w-5" />
            </button>

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
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholderText()}
              className="w-full px-4 py-3 text-base border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md border-gray-200"
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md"
            >
              <Send className="h-5 w-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Share/Export Modal */}
      <ShareExportModal
        isOpen={showShareExportModal}
        onClose={() => setShowShareExportModal(false)}
        messages={messages}
        userEmail={user?.email}
        userName={user?.email}
      />

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
                Are you sure you want to clear your entire chat history? This action cannot be undone and will delete all your chat sessions.
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