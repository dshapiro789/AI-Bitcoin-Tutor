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

  const updateModel = (modelId: string, updatedModel: Partial<AIModel>) => {
    setModels(prevModels => {
      // If setting a model as active, deactivate all others
      if (updatedModel.active) {
        prevModels = prevModels.map(m => ({
          ...m,
          active: false
        }));
      }

      return prevModels.map(model => 
        model.id === modelId
          ? { ...model, ...updatedModel }
          : model
      );
    });

    // Update the AI service with the new model if it's being set as active
    if (updatedModel.active) {
      const model = models.find(m => m.id === modelId);
      if (model) {
        aiService.setModel({ ...model, ...updatedModel });
      }
    }
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
    contextMemory
  };
}