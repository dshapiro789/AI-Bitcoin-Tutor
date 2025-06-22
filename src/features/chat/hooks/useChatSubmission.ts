import { useState } from 'react';
import { AIModel, Message } from '../types';
import { aiService } from '../../../services/ai';
import { chatService } from '../services/chatService';
import { v4 as uuidv4 } from 'uuid';

interface UseChatSubmissionOptions {
  onSuccess?: (userMessage: Message, aiMessage: Message) => void;
  onError?: (error: string) => void;
}

export function useChatSubmission(
  userId: string,
  sessionId: string,
  options: UseChatSubmissionOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMessage = async (text: string, model: AIModel, knowledgeLevel?: string) => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        text,
        isUser: true,
        model: model.name,
        timestamp: new Date(),
        category: determineCategory(text),
        codeBlocks: parseCodeBlocks(text)
      };

      // Save user message
      await chatService.saveMessage(userMessage, sessionId, userId);

      // Create knowledge-level aware prompt
      let enhancedPrompt = text;
      if (knowledgeLevel) {
        const levelPrompt = getKnowledgeLevelPrompt(knowledgeLevel);
        enhancedPrompt = `[User Knowledge Level: ${knowledgeLevel}. ${levelPrompt}]\n\nUser Question: ${text}`;
      }

      // Get AI response
      const response = await aiService.sendMessage(enhancedPrompt);

      // Create AI message
      const aiMessage: Message = {
        id: uuidv4(),
        text: response,
        isUser: false,
        model: model.name,
        timestamp: new Date(),
        category: determineCategory(response),
        codeBlocks: parseCodeBlocks(response),
        quickReplies: generateQuickReplies(response)
      };

      // Save AI message
      await chatService.saveMessage(aiMessage, sessionId, userId);

      // Update session metadata
      await chatService.updateChatSession(sessionId, userId, {
        lastMessagePreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        messageCount: await getMessageCount(sessionId)
      });

      options.onSuccess?.(userMessage, aiMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitMessage,
    isSubmitting,
    error,
    clearError: () => setError(null)
  };
}

// Helper functions
function determineCategory(text: string): Message['category'] {
  if (text.includes('?')) return 'question';
  if (text.includes('```')) return 'code';
  if (text.toLowerCase().includes('error') || text.includes('❌')) return 'error';
  if (text.includes('✅') || text.toLowerCase().includes('success')) return 'success';
  return 'explanation';
}

function parseCodeBlocks(text: string) {
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
}

function generateQuickReplies(response: string): string[] {
  // Implementation from original useAIChat hook
  const quickReplies: string[] = [];
  const responseText = response.toLowerCase();
  
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
    // ... other concepts
  };

  const foundConcepts: string[] = [];
  for (const [concept, questions] of Object.entries(bitcoinConcepts)) {
    if (responseText.includes(concept)) {
      foundConcepts.push(concept);
    }
  }

  foundConcepts.slice(0, 3).forEach(concept => {
    const conceptQuestions = bitcoinConcepts[concept as keyof typeof bitcoinConcepts];
    if (conceptQuestions && conceptQuestions.length > 0) {
      const randomQuestion = conceptQuestions[Math.floor(Math.random() * conceptQuestions.length)];
      if (!quickReplies.includes(randomQuestion)) {
        quickReplies.push(randomQuestion);
      }
    }
  });

  if (quickReplies.length === 0) {
    const generalQuestions = [
      'Can you explain this in simpler terms?',
      'What are the practical implications?',
      'How does this relate to everyday use?'
    ];
    quickReplies.push(...generalQuestions.slice(0, 3));
  }

  return [...new Set(quickReplies)].slice(0, 4);
}

function getKnowledgeLevelPrompt(level: string): string {
  const prompts = {
    'novice': 'The user is completely new to Bitcoin. Use simple language, avoid jargon, provide basic explanations.',
    'beginner': 'The user knows what Bitcoin is but needs clear explanations of concepts.',
    'intermediate': 'The user understands Bitcoin basics. You can use technical terminology.',
    'advanced': 'The user has solid Bitcoin knowledge. Engage with technical details.',
    'expert': 'The user is highly knowledgeable. Discuss cutting-edge developments.'
  };
  
  return prompts[level as keyof typeof prompts] || prompts['beginner'];
}

async function getMessageCount(sessionId: string): Promise<number> {
  const { count, error } = await chatService.getChatHistory('', sessionId);
  return count || 0;
}