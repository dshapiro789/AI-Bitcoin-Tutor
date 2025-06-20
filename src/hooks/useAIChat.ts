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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentThoughts, setCurrentThoughts] = useState<string | null>(null);
  const [contextMemory, setContextMemory] = useState<number>(0);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [starterQuestions, setStarterQuestions] = useState<string[]>([]);
  
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const { checkLimit, incrementCount, getRemainingMessages } = useChatLimitStore();

  const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');

  useEffect(() => {
    loadModels();
    if (user) {
      loadChatHistory();
      loadUserModelSettings();
      
      // Check if we should show welcome screen
      if (!user.knowledgeLevel) {
        setShowWelcomeScreen(true);
        setMessages([]); // Clear any existing messages
      } else {
        setShowWelcomeScreen(false);
        // Load initial message with starter questions if no chat history
        if (messages.length === 0) {
          loadInitialMessage(user.knowledgeLevel);
        }
      }
    }
  }, [user]);

  const loadModels = async () => {
    try {
      // Set the default model
      setModels(defaultModels);
      aiService.setModel(defaultModels[0]);
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load AI models');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialMessage = (knowledgeLevel: string) => {
    const questions = generateStarterQuestions(knowledgeLevel);
    setStarterQuestions(questions);
    
    const welcomeMessage: Message = {
      id: '1',
      text: `Welcome back! I see you're at the **${knowledgeLevel}** level. I'm here to help you learn more about Bitcoin. What would you like to explore today?`,
      isUser: false,
      timestamp: new Date(),
      quickReplies: questions
    };
    
    setMessages([welcomeMessage]);
  };

  const generateStarterQuestions = (level: string): string[] => {
    const questionsByLevel = {
      'novice': [
        "What is Bitcoin and why was it created?",
        "How is Bitcoin different from regular money?",
        "Is Bitcoin safe to use?",
        "How do I get my first Bitcoin?",
        "What is a Bitcoin wallet?"
      ],
      'beginner': [
        "How does Bitcoin mining work?",
        "What is the blockchain and how does it work?",
        "How do Bitcoin transactions work?",
        "What are Bitcoin addresses and private keys?",
        "Why is Bitcoin's supply limited to 21 million?"
      ],
      'intermediate': [
        "What is the Lightning Network and how does it work?",
        "How do multisig wallets improve security?",
        "What are the different types of Bitcoin nodes?",
        "How does Bitcoin's difficulty adjustment work?",
        "What are the privacy considerations with Bitcoin?"
      ],
      'advanced': [
        "How do Bitcoin script opcodes work?",
        "What are the technical details of Schnorr signatures?",
        "How does Taproot improve Bitcoin's functionality?",
        "What are the economics of Bitcoin mining pools?",
        "How do atomic swaps work technically?"
      ],
      'expert': [
        "What are the latest developments in Bitcoin Core?",
        "How might quantum computing affect Bitcoin?",
        "What are the trade-offs in different scaling solutions?",
        "How do covenant proposals change Bitcoin's capabilities?",
        "What are the implications of different fee market designs?"
      ]
    };

    return questionsByLevel[level as keyof typeof questionsByLevel] || questionsByLevel['beginner'];
  };

  const handleKnowledgeLevelSelection = async (level: string) => {
    try {
      const { updateKnowledgeLevel } = useAuthStore.getState();
      await updateKnowledgeLevel(level);
      
      setShowWelcomeScreen(false);
      
      // Generate personalized welcome message and starter questions
      const questions = generateStarterQuestions(level);
      setStarterQuestions(questions);
      
      const levelDescriptions = {
        'novice': "You're just starting your Bitcoin journey - that's exciting! I'll explain everything in simple terms.",
        'beginner': "You have some Bitcoin knowledge. I'll help you build on what you know with clear explanations.",
        'intermediate': "You understand the basics well. I'll dive deeper into technical concepts and practical applications.",
        'advanced': "You have solid Bitcoin knowledge. I'll explore complex topics and technical details with you.",
        'expert': "You're highly knowledgeable about Bitcoin. I'll discuss cutting-edge developments and nuanced topics."
      };
      
      const welcomeMessage: Message = {
        id: '1',
        text: `Perfect! I've set your knowledge level to **${level}**. ${levelDescriptions[level as keyof typeof levelDescriptions]} 

Your preference has been saved for future conversations. You can always change this in the settings if needed.

What would you like to learn about today?`,
        isUser: false,
        timestamp: new Date(),
        quickReplies: questions
      };
      
      setMessages([welcomeMessage]);
      
    } catch (err) {
      setError('Failed to save knowledge level. Please try again.');
      console.error('Error setting knowledge level:', err);
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

        setMessages(historyMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const loadMessagesFromHistory = (historyMessages: any[]) => {
    const formattedMessages: Message[] = historyMessages.map(msg => ({
      id: msg.id,
      text: msg.message_text,
      isUser: msg.is_user,
      model: msg.model_used,
      timestamp: new Date(msg.created_at),
      category: msg.category as Message['category'],
      codeBlocks: msg.metadata?.codeBlocks || [],
      quickReplies: msg.metadata?.quickReplies || []
    }));

    setMessages(formattedMessages);
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
        // Filter out old DeepSeek model IDs to prevent duplicates
        const filteredData = data.filter(model => 
          model.model_id !== 'deepseek/deepseek-chat-v3-0324:free' && // Old model ID
          model.model_id !== 'gemma-2b-it' // Also filter out Gemma models
        );
        
        const userModels: AIModel[] = filteredData.map(model => ({
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

  const deleteCustomModel = async (modelId: string) => {
    if (!user) return;

    try {
      // Check if this is the default model
      const isDefaultModel = defaultModels.some(m => m.id === modelId);
      if (isDefaultModel) {
        throw new Error('Cannot delete the default model');
      }

      // Remove from local state
      setModels(prev => prev.filter(m => m.id !== modelId));
      
      // Remove from database
      const { error } = await supabase
        .from('user_models')
        .delete()
        .eq('user_id', user.id)
        .eq('model_id', modelId);

      if (error) throw error;

      // If the deleted model was active, set the default model as active
      const deletedModel = models.find(m => m.id === modelId);
      if (deletedModel?.active) {
        const defaultModel = defaultModels[0];
        updateModel(defaultModel.id, { active: true });
      }
    } catch (err) {
      console.error('Error deleting custom model:', err);
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

      // Reset to appropriate initial state
      if (user.knowledgeLevel) {
        loadInitialMessage(user.knowledgeLevel);
      } else {
        setMessages([]);
        setShowWelcomeScreen(true);
      }
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

    const content = `# Bitcoin AI Tutor Chat History\n\nExported on: ${new Date().toLocaleString()}\nKnowledge Level: ${user?.knowledgeLevel || 'Not set'}\n\n${chatContent}`;
    
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

  // Enhanced quick replies generation with more intelligent topic detection
  const generateQuickReplies = (response: string): string[] => {
    const quickReplies: string[] = [];
    const responseText = response.toLowerCase();
    
    // Define Bitcoin concepts and their related follow-up questions
    const bitcoinConcepts = {
      'bitcoin': [
        'How does Bitcoin compare to traditional money?',
        'What makes Bitcoin unique?',
        'How do I get started with Bitcoin?'
      ],
      'blockchain': [
        'How does blockchain ensure security?',
        'What is a block in the blockchain?',
        'How are transactions verified?'
      ],
      'mining': [
        'What equipment is needed for mining?',
        'How does mining difficulty work?',
        'What is the mining reward?'
      ],
      'wallet': [
        'What are the different types of wallets?',
        'How do I secure my wallet?',
        'What is a seed phrase?'
      ],
      'private key': [
        'How do I keep my private keys safe?',
        'What happens if I lose my private key?',
        'What is the difference between private and public keys?'
      ],
      'lightning network': [
        'How do Lightning channels work?',
        'What are the benefits of Lightning Network?',
        'How do I use Lightning payments?'
      ],
      'transaction': [
        'How long do transactions take?',
        'What are transaction fees?',
        'How can I track my transaction?'
      ],
      'node': [
        'How do I run a Bitcoin node?',
        'What is the difference between full and light nodes?',
        'Why should I run my own node?'
      ],
      'halving': [
        'When is the next Bitcoin halving?',
        'How does halving affect the price?',
        'What happens to miners during halving?'
      ],
      'satoshi': [
        'Who is Satoshi Nakamoto?',
        'What is a satoshi unit?',
        'How many satoshis are in a Bitcoin?'
      ],
      'proof of work': [
        'How does Proof of Work secure Bitcoin?',
        'What is the energy consumption of Bitcoin?',
        'Why is Proof of Work important?'
      ],
      'multisig': [
        'How does multisig improve security?',
        'What are common multisig setups?',
        'How do I create a multisig wallet?'
      ],
      'cold storage': [
        'What is the best cold storage method?',
        'How do I set up cold storage?',
        'What are hardware wallets?'
      ],
      'exchange': [
        'How do I choose a Bitcoin exchange?',
        'What are the risks of keeping Bitcoin on exchanges?',
        'How do I withdraw Bitcoin from an exchange?'
      ],
      'volatility': [
        'Why is Bitcoin volatile?',
        'How can I manage Bitcoin volatility?',
        'What affects Bitcoin price?'
      ],
      'regulation': [
        'How do governments regulate Bitcoin?',
        'Is Bitcoin legal in my country?',
        'What are the tax implications of Bitcoin?'
      ],
      'scalability': [
        'How does Bitcoin handle scalability?',
        'What are second-layer solutions?',
        'How many transactions can Bitcoin process?'
      ],
      'fork': [
        'What is a Bitcoin fork?',
        'What was the Bitcoin Cash fork about?',
        'How do forks affect my Bitcoin?'
      ],
      'consensus': [
        'How does Bitcoin achieve consensus?',
        'What happens when nodes disagree?',
        'How are protocol changes made?'
      ],
      'inflation': [
        'How does Bitcoin protect against inflation?',
        'What is Bitcoin\'s monetary policy?',
        'Why is the 21 million limit important?'
      ]
    };

    // Find relevant concepts in the response
    const foundConcepts: string[] = [];
    for (const [concept, questions] of Object.entries(bitcoinConcepts)) {
      if (responseText.includes(concept)) {
        foundConcepts.push(concept);
      }
    }

    // Generate quick replies based on found concepts
    foundConcepts.slice(0, 3).forEach(concept => {
      const conceptQuestions = bitcoinConcepts[concept as keyof typeof bitcoinConcepts];
      if (conceptQuestions && conceptQuestions.length > 0) {
        // Pick a random question from the concept's questions
        const randomQuestion = conceptQuestions[Math.floor(Math.random() * conceptQuestions.length)];
        if (!quickReplies.includes(randomQuestion)) {
          quickReplies.push(randomQuestion);
        }
      }
    });

    // If no specific concepts found, provide general follow-up questions
    if (quickReplies.length === 0) {
      const generalQuestions = [
        'Can you explain this in simpler terms?',
        'What are the practical implications?',
        'How does this relate to everyday use?',
        'What should beginners know about this?',
        'Are there any risks I should be aware of?'
      ];
      quickReplies.push(...generalQuestions.slice(0, 3));
    }

    // Ensure we don't exceed 4 quick replies and they're unique
    return [...new Set(quickReplies)].slice(0, 4);
  };

  const getKnowledgeLevelPrompt = (level: string): string => {
    const prompts = {
      'novice': 'The user is completely new to Bitcoin. Use simple language, avoid jargon, provide basic explanations, and use analogies to everyday concepts. Be encouraging and patient.',
      'beginner': 'The user knows what Bitcoin is but needs clear explanations of concepts. Use accessible language while introducing some technical terms with explanations.',
      'intermediate': 'The user understands Bitcoin basics. You can use technical terminology and dive deeper into concepts, but still provide context for complex topics.',
      'advanced': 'The user has solid Bitcoin knowledge. Engage with technical details, discuss nuances, and explore complex interconnections between concepts.',
      'expert': 'The user is highly knowledgeable. Discuss cutting-edge developments, technical specifications, and nuanced aspects of Bitcoin technology and economics.'
    };
    
    return prompts[level as keyof typeof prompts] || prompts['beginner'];
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
      "Adapting response to your knowledge level...",
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
      // Create knowledge-level aware prompt
      let enhancedPrompt = text;
      if (user?.knowledgeLevel) {
        const levelPrompt = getKnowledgeLevelPrompt(user.knowledgeLevel);
        enhancedPrompt = `[User Knowledge Level: ${user.knowledgeLevel}. ${levelPrompt}]\n\nUser Question: ${text}`;
      }

      const response = await aiService.sendMessage(enhancedPrompt);

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
    addCustomModel,
    deleteCustomModel,
    showWelcomeScreen,
    setShowWelcomeScreen,
    handleKnowledgeLevelSelection,
    starterQuestions,
    loadMessagesFromHistory
  };
}