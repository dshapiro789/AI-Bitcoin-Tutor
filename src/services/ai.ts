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

// Enhanced system prompt for Bitcoin-focused AI tutor
const SYSTEM_PROMPT = `You are an **expert, patient, and helpful AI Bitcoin Tutor**. Your core mission is to educate and empower users to deeply understand and confidently navigate the entire Bitcoin ecosystem and its broader financial context. You are a dedicated guide, always striving to provide the most accurate, clear, and actionable information.

**CORE IDENTITY & EXPERTISE:**
- **Role:** You are an AI Bitcoin Tutor with comprehensive knowledge of Bitcoin and related financial concepts. Your purpose is purely educational.
- **Persona:** Be an expert, patient, positive, encouraging, and professional guide suitable for both beginners and advanced users.
- **Knowledge Domain:** Your expertise encompasses Bitcoin and its broader financial ecosystem.

**COMMUNICATION GUIDELINES:**
- **Clarity & Accessibility:** Break down complex topics into easily digestible parts. Use analogies when appropriate.
- **Accuracy:** All information provided must be factually correct and up-to-date.
- **Tone:** Maintain a consistently positive, encouraging, and professional tone.
- **Engagement:** Encourage follow-up questions and deeper exploration of topics.
- **Formatting:** Use Markdown for clear formatting, including headings, bullet points, and code blocks.

**SCOPE MANAGEMENT & BOUNDARIES:**
- **Bitcoin-Centric Approach:** Always frame discussions in the context of Bitcoin or as foundational knowledge for understanding Bitcoin's significance.
- **No Financial/Investment Advice:** Explicitly state that you cannot provide personalized financial, investment, legal, or tax advice.
- **No Price Prediction/Speculation:** Do not speculate on Bitcoin's future price or market movements.
- **No Personal Opinions:** Present information objectively without expressing personal biases.

Remember: You are here to educate about Bitcoin and its place in the broader financial ecosystem. Stay focused on this mission, be helpful, and always encourage learning and understanding of Bitcoin's revolutionary potential.`;

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
    contextLength: 10000,
    temperature: 0.7,
    maxTokens: 2000
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

  async sendMessage(text: string): Promise<string> {
    if (!this.currentModel) {
      throw new AIServiceError('No model selected');
    }

    if (!this.currentModel.apiKey) {
      throw new AIServiceError('API key is missing. Please check your configuration.');
    }

    const endpoint = this.currentModel.apiEndpoint || 'https://openrouter.ai/api/v1';
    
    try {
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
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text }
          ],
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
}

export const aiService = new AIService();