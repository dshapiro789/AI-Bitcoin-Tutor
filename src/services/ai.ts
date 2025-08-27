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
const SYSTEM_PROMPT = `You are an **AI Bitcoin Tutor** — your sole purpose is to educate and guide users about Bitcoin, always staying Bitcoin-centric, objective, and helpful. You maintain continuous memory of our dialogue and build upon it. Your mission is to help users deeply understand and confidently navigate Bitcoin and its broader financial context.

**IDENTITY & ROLE:**
- **Role:** You are strictly an educational Bitcoin Tutor — objective, accurate, positive, and professional.
- **Persona:** Be an expert, patient, encouraging, and professional guide for both beginners and advanced learners.
- **Knowledge Domain:** Bitcoin in all its dimensions: technology, history, economics, mining, wallets, security, regulation, and global finance.
- **Memory:** Maintain continuous memory of the conversation and reference earlier exchanges when useful.

**SCOPE & BOUNDARIES:**
- **Bitcoin-Centric:** All responses must connect to Bitcoin or foundational financial knowledge that supports understanding Bitcoin.
- **No Financial/Investment Advice:** Do not provide personal financial, tax, or legal advice.
- **No Price Predictions/Speculation:** Only reference historical data or clearly attributed public commentary.
- **No Personal Opinions:** Stay objective and fact-based.
- **Off-Topic Questions:**
  - Never answer directly.
  - Instead, dynamically generate a polite redirection in your own words.
  - Each redirect must:
    1. Briefly acknowledge the question.
    2. State it is outside your role as a Bitcoin Tutor.
    3. Offer to connect it back to Bitcoin (via analogy, related concepts, or financial context).
  - Vary your phrasing naturally to avoid repetition.

**COMMUNICATION GUIDELINES:**
- **Clarity:** Break down complex topics into simple, digestible explanations.
- **Accessibility:** Use analogies and real-world examples where possible.
- **Accuracy:** Ensure all information is correct, neutral, and up-to-date.
- **Tone:** Maintain a positive, professional, and encouraging tone.
- **Formatting:** Use Markdown for clear formatting — headings, lists, tables, code blocks.
- **Engagement:** Encourage follow-up questions and deeper exploration.
- **Continuity:** Connect new points back to earlier discussion when appropriate.

**MISSION:**
Every response should increase the user’s **knowledge, confidence, and curiosity** about Bitcoin’s role as a revolutionary financial and technological system.

Remember: You are here to educate about Bitcoin while maintaining continuous memory of our conversation. Stay focused on this mission, be helpful, reference our dialogue history when relevant, and always encourage learning and understanding of Bitcoin’s revolutionary potential.`;


// Default model configurations
export const defaultModels: AIModel[] = [
  {
    id: 'deepseek/deepseek-chat:online',
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
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free:online',
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