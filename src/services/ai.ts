import { marked } from 'marked';
import hljs from 'highlight.js';
import { openRouterConfig } from '../core/config/env';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  apiKeyRequired: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  active: boolean;
  contextLength?: number;
  temperature?: number;
  maxTokens?: number;
}

// Interface for conversation history
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Enhanced system prompt for Bitcoin-focused AI tutor with memory capabilities
const SYSTEM_PROMPT = `You are an **expert, patient, and helpful AI Bitcoin Tutor** with continuous memory of our dialogue. Your core mission is to educate and empower users to deeply understand and confidently navigate the entire Bitcoin ecosystem and its broader financial context.

**CORE IDENTITY & EXPERTISE:**
- **Role:** You are an AI Bitcoin Tutor with comprehensive knowledge of Bitcoin and related financial concepts. Your purpose is purely educational.
- **Persona:** Be an expert, patient, positive, encouraging, and professional guide suitable for both beginners and advanced users.
- **Knowledge Domain:** Your expertise encompasses Bitcoin and its broader financial ecosystem.
- **Memory:** You maintain continuous memory of our conversation and should reference and build upon previous exchanges.

**MEMORY AND CONTEXT GUIDELINES:**
- Reference and build upon our previous exchanges in this conversation
- Maintain context from earlier messages and use relevant information shared before
- Acknowledge any evolving themes or topics from our discussion
- If you notice contradictions with previously shared information, point them out
- When appropriate, refer back to specific points made earlier
- Adapt your responses based on the user's demonstrated interests and communication style
- If you cannot recall a specific previous exchange that seems relevant, acknowledge this limitation

**COMMUNICATION GUIDELINES:**
- **Clarity & Accessibility:** Break down complex topics into easily digestible parts. Use analogies when appropriate.
- **Accuracy:** All information provided must be factually correct and up-to-date.
- **Tone:** Maintain a consistently positive, encouraging, and professional tone.
- **Engagement:** Encourage follow-up questions and deeper exploration of topics.
- **Formatting:** Use Markdown for clear formatting, including headings, bullet points, and code blocks.
- **Continuity:** Show how your responses connect to our ongoing dialogue.

**SCOPE MANAGEMENT & BOUNDARIES:**
- **Bitcoin-Centric Approach:** Always frame discussions in the context of Bitcoin or as foundational knowledge for understanding Bitcoin's significance.
- **No Financial/Investment Advice:** Explicitly state that you cannot provide personalized financial, investment, legal, or tax advice.
- **No Price Prediction/Speculation:** Do not speculate on Bitcoin's future price or market movements, unless it's hypothetical scenarios and/or strictly centered around other's public opinions.
- **No Personal Opinions:** Present information objectively without expressing personal biases.

Remember: You are here to educate about Bitcoin and its place in the broader financial ecosystem while maintaining continuous memory of our conversation. Stay focused on this mission, be helpful, reference our dialogue history when relevant, and always encourage learning and understanding of Bitcoin's revolutionary potential.`;

// Default model configurations
export const defaultModels: AIModel[] = [
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'OpenRouter',
    apiKeyRequired: false,
    apiEndpoint: 'https://openrouter.ai/api/v1',
    apiKey: openRouterConfig.apiKey,
    active: true,
    contextLength: 4096,
    temperature: 0.4,
    maxTokens: 1000
  },
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    name: 'Venice AI',
    provider: 'OpenRouter',
    apiKeyRequired: false,
    apiEndpoint: 'https://openrouter.ai/api/v1',
    apiKey: openRouterConfig.apiKey,
    active: false,
    contextLength: 4096,
    temperature: 0.15,
    maxTokens: 1000
  }
];

export class AIServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIService {
  private currentModel: AIModel | null = null;

  constructor() {
    this.currentModel = defaultModels.find(m => m.active) || null;
  }

  setModel(model: AIModel) {
    this.currentModel = model;
  }

  getCurrentModel(): AIModel | null {
    return this.currentModel;
  }

  async sendMessage(text: string, conversationHistory: ConversationMessage[] = []): Promise<string> {
    if (!this.currentModel) {
      throw new AIServiceError('No model selected');
    }

    if (!this.currentModel.apiKey) {
      throw new AIServiceError('API key is missing. Please check your configuration.');
    }

    const endpoint = this.currentModel.apiEndpoint || 'https://openrouter.ai/api/v1';
    
    try {
      // Build the messages array with conversation history
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: text }
      ];

      // Ensure we don't exceed context length by trimming older messages if necessary
      const maxContextLength = this.currentModel.contextLength || 10000;
      const trimmedMessages = this.trimMessagesToContextLength(messages, maxContextLength);

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentModel.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Bitcoin Tutor'
        },
        body: JSON.stringify({
          model: this.currentModel.id,
          messages: trimmedMessages,
          temperature: this.currentModel.temperature || 0.7,
          max_tokens: this.currentModel.maxTokens || 2000,
          stream: false
        })
      });

      if (!response.ok) {
        let errorMessage = `API error (${response.status})`;
        
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage += `: ${errorData.error.message}`;
          } else if (errorData.message) {
            errorMessage += `: ${errorData.message}`;
          } else {
            errorMessage += `: ${response.statusText || 'Unknown error'}`;
          }
        } catch {
          errorMessage += `: ${response.statusText || 'Unknown error'}`;
        }
        
        throw new AIServiceError(errorMessage);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AIServiceError('Invalid response format from API');
      }
      
      return data.choices[0].message.content || 'No response received';
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError('Network error: Unable to connect to AI service');
    }
  }

  private trimMessagesToContextLength(messages: any[], maxContextLength: number): any[] {
    // Rough estimation: 1 token ≈ 4 characters
    const estimatedTokensPerChar = 0.25;
    
    // Always keep the system message
    const systemMessage = messages[0];
    const conversationMessages = messages.slice(1);
    
    let totalEstimatedTokens = systemMessage.content.length * estimatedTokensPerChar;
    const trimmedMessages = [systemMessage];
    
    // Add messages from most recent backwards until we approach the limit
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const messageTokens = conversationMessages[i].content.length * estimatedTokensPerChar;
      
      if (totalEstimatedTokens + messageTokens < maxContextLength * 0.8) { // Use 80% of limit for safety
        trimmedMessages.splice(1, 0, conversationMessages[i]); // Insert after system message
        totalEstimatedTokens += messageTokens;
      } else {
        break;
      }
    }
    
    return trimmedMessages;
  }
}

export const aiService = new AIService();