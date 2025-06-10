import { useState, useEffect } from 'react';
import { AIModel, defaultModels, aiService } from '../services/ai';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useChatLimitStore } from '../store/chatLimitStore';
import { marked } from 'marked';

export interface MessageReaction {
  type: '👍';
  timestamp: Date;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  model?: string;
  timestamp: Date;
  reactions?: MessageReaction[];
  category?: 'question' | 'explanation' | 'code' | 'error' | 'success';
  codeBlocks?: { language: string; code: string }[];
  quickReplies?: string[];
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Bitcoin AI Tutor. What would you like to learn about?",
      isUser: false,
      timestamp: new Date(),
      quickReplies: [
        "What is Bitcoin?",
        "How does mining work?",
        "Explain Lightning Network",
        "Bitcoin vs Altcoins"
      ]
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentThoughts, setCurrentThoughts] = useState<string | null>(null);
  const [contextMemory, setContextMemory] = useState<number>(0);
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const { checkLimit, incrementCount, getRemainingMessages } = useChatLimitStore();

  const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');

  useEffect(() => {
    loadModels();
    if (user) {
      loadChatHistory();
      loadUserModelSettings();
    }
  }, [user]);

  const loadModels = async () => {
    try {
      // Set the default Gemma model
      setModels(defaultModels);
      aiService.setModel(defaultModels[0]);
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load AI models');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50); // Load last 50 messages

      if (error) throw error;

      if (data && data.length > 0) {
        const historyMessages: Message[] = data.map(msg => ({
          id: msg.id,
          text: msg.message_text,
          isUser: msg.is_user,
          model: msg.model_used,
          timestamp: new Date(msg.created_at),
          category: msg.category as Message['category'],
          codeBlocks: msg.metadata?.codeBlocks || [],
          quickReplies: msg.metadata?.quickReplies || []
        }));

        // Keep the welcome message and add history
        setMessages(prev => [prev[0], ...historyMessages]);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const loadUserModelSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_models')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const userModels: AIModel[] = data.map(model => ({
          id: model.model_id,
          name: model.name,
          provider: model.provider,
          apiKeyRequired: !!model.api_key,
          apiKey: model.api_key,
          apiEndpoint: model.api_endpoint,
          active: model.active,
          contextLength: model.context_length,
          temperature: model.temperature,
          maxTokens: model.max_tokens
        }));

        // Merge with default models, prioritizing user settings
        const mergedModels = [...defaultModels];
        
        // Add user custom models
        userModels.forEach(userModel => {
          const existingIndex = mergedModels.findIndex(m => m.id === userModel.id);
          if (existingIndex >= 0) {
            // Update existing model with user settings
            mergedModels[existingIndex] = { ...mergedModels[existingIndex], ...userModel };
          } else {
            // Add new custom model
            mergedModels.push(userModel);
          }
        });

        setModels(mergedModels);

        // Set active model
        const activeModel = mergedModels.find(m => m.active);
        if (activeModel) {
          aiService.setModel(activeModel);
        }
      }
    } catch (err) {
      console.error('Error loading user model settings:', err);
    }
  };

  const saveMessageToHistory = async (message: Message) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          message_text: message.text,
          is_user: message.isUser,
          model_used: message.model,
          category: message.category,
          metadata: {
            codeBlocks: message.codeBlocks || [],
            quickReplies: message.quickReplies || []
          }
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving message to history:', err);
    }
  };

  const saveUserModelSettings = async (model: AIModel) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_models')
        .upsert({
          user_id: user.id,
          model_id: model.id,
          name: model.name,
          provider: model.provider,
          api_key: model.apiKey,
          api_endpoint: model.apiEndpoint,
          active: model.active,
          context_length: model.contextLength,
          temperature: model.temperature,
          max_tokens: model.maxTokens,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving user model settings:', err);
      throw err;
    }
  };

  const addCustomModel = async (model: AIModel) => {
    if (!user) return;

    try {
      // Add to local state
      setModels(prev => [...prev, model]);
      
      // Save to database
      await saveUserModelSettings(model);
    } catch (err) {
      console.error('Error adding custom model:', err);
      throw err;
    }
  };

  const clearChatHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Reset to welcome message only
      setMessages([{
        id: '1',
        text: "Hi! I'm your Bitcoin AI Tutor. What would you like to learn about?",
        isUser: false,
        timestamp: new Date(),
        quickReplies: [
          "What is Bitcoin?",
          "How does mining work?",
          "Explain Lightning Network",
          "Bitcoin vs Altcoins"
        ]
      }]);
    } catch (err) {
      console.error('Error clearing chat history:', err);
      throw err;
    }
  };

  const exportChatHistory = () => {
    const chatContent = messages
      .filter(msg => msg.id !== '1') // Exclude welcome message
      .map(msg => {
        const timestamp = msg.timestamp.toLocaleString();
        const sender = msg.isUser ? 'You' : `AI (${msg.model || 'Assistant'})`;
        return `[${timestamp}] ${sender}:\n${msg.text}\n`;
      })
      .join('\n');

    const content = `# Bitcoin AI Tutor Chat History\n\nExported on: ${new Date().toLocaleString()}\n\n${chatContent}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitcoin-chat-history-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateModel = (modelId: string, updatedModel: Partial<AIModel>) => {
    setModels(prevModels => {
      // If setting a model as active, deactivate all others
      if (updatedModel.active) {
        prevModels = prevModels.map(m => ({
          ...m,
          active: false
        }));
      }

      const newModels = prevModels.map(model => 
        model.id === modelId
          ? { ...model, ...updatedModel }
          : model
      );

      // Update the AI service with the new model if it's being set as active
      if (updatedModel.active) {
        const model = newModels.find(m => m.id === modelId);
        if (model) {
          aiService.setModel(model);
          // Save user model settings
          if (user && model.apiKeyRequired) {
            saveUserModelSettings(model);
          }
        }
      }

      return newModels;
    });
  };

  const parseCodeBlocks = (text: string) => {
    const codeBlocks: { language: string; code: string }[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }

    return codeBlocks;
  };

  const determineCategory = (text: string): Message['category'] => {
    if (text.includes('?')) return 'question';
    if (text.includes('```')) return 'code';
    if (text.toLowerCase().includes('error') || text.includes('❌')) return 'error';
    if (text.includes('✅') || text.toLowerCase().includes('success')) return 'success';
    return 'explanation';
  };

  const generateQuickReplies = (response: string): string[] => {
    const topics = response.match(/\b(Bitcoin|blockchain|mining|Lightning Network|wallet|node|transaction)\b/g);
    if (!topics) return [];

    const uniqueTopics = Array.from(new Set(topics));
    return uniqueTopics.map(topic => `Tell me more about ${topic}`).slice(0, 3);
  };

  const sendMessage = async (text: string, model: AIModel) => {
    if (!text.trim() || isProcessing) return;
    
    if (!isPremium && user) {
      if (!checkLimit(user.id)) {
        setError('You have reached your hourly message limit. Please upgrade to premium for unlimited access.');
        return;
      }
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      isUser: true,
      model: model.name,
      timestamp: new Date(),
      category: determineCategory(text),
      codeBlocks: parseCodeBlocks(text)
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to history
    if (user) {
      await saveMessageToHistory(userMessage);
    }

    setIsProcessing(true);
    setError(null);

    const thoughts = [
      "Analyzing question context...",
      "Retrieving relevant Bitcoin knowledge...",
      "Formulating comprehensive response...",
      "Verifying technical accuracy...",
      "Preparing final answer..."
    ];

    let thoughtIndex = 0;
    const thoughtInterval = setInterval(() => {
      if (thoughtIndex < thoughts.length) {
        setCurrentThoughts(thoughts[thoughtIndex]);
        thoughtIndex++;
      }
    }, 1000);

    try {
      const response = await aiService.sendMessage(text);

      if (!isPremium && user) {
        incrementCount(user.id);
      }

      const aiMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: response,
        isUser: false,
        model: model.name,
        timestamp: new Date(),
        category: determineCategory(response),
        codeBlocks: parseCodeBlocks(response),
        quickReplies: generateQuickReplies(response)
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to history
      if (user) {
        await saveMessageToHistory(aiMessage);
      }

      setContextMemory(prev => prev + 1);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
    } finally {
      clearInterval(thoughtInterval);
      setCurrentThoughts(null);
      setIsProcessing(false);
    }
  };

  return {
    messages,
    isProcessing,
    error,
    models,
    isLoading,
    sendMessage,
    updateModel,
    remainingMessages: !isPremium && user ? getRemainingMessages(user.id) : Infinity,
    isPremium,
    currentThoughts,
    contextMemory,
    clearChatHistory,
    exportChatHistory,
    saveUserModelSettings,
    addCustomModel
  };
}