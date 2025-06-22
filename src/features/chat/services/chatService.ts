import { supabase } from '../../../lib/supabase';
import { Message, ChatSession } from '../types';

export class ChatServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export class ChatService {
  async getChatHistory(userId: string, sessionId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw new ChatServiceError(error.message, error.code);

      return data.map(this.mapToChatMessage);
    } catch (error) {
      if (error instanceof ChatServiceError) throw error;
      throw new ChatServiceError('Failed to fetch chat history');
    }
  }

  async saveMessage(message: Message, sessionId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          message_text: message.text,
          is_user: message.isUser,
          model_used: message.model,
          category: message.category,
          metadata: {
            codeBlocks: message.codeBlocks || [],
            quickReplies: message.quickReplies || []
          }
        });

      if (error) throw new ChatServiceError(error.message, error.code);
    } catch (error) {
      if (error instanceof ChatServiceError) throw error;
      throw new ChatServiceError('Failed to save message');
    }
  }

  async createChatSession(userId: string, title: string = 'New Chat'): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title,
          last_message_preview: '',
          message_count: 0
        })
        .select('id')
        .single();

      if (error) throw new ChatServiceError(error.message, error.code);
      return data.id;
    } catch (error) {
      if (error instanceof ChatServiceError) throw error;
      throw new ChatServiceError('Failed to create chat session');
    }
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw new ChatServiceError(error.message, error.code);

      return data.map(session => ({
        id: session.id,
        title: session.title,
        lastMessagePreview: session.last_message_preview || 'No messages yet',
        messageCount: session.message_count || 0,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at)
      }));
    } catch (error) {
      if (error instanceof ChatServiceError) throw error;
      throw new ChatServiceError('Failed to fetch chat sessions');
    }
  }

  async updateChatSession(sessionId: string, userId: string, updates: Partial<ChatSession>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          title: updates.title,
          last_message_preview: updates.lastMessagePreview,
          message_count: updates.messageCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw new ChatServiceError(error.message, error.code);
    } catch (error) {
      if (error instanceof ChatServiceError) throw error;
      throw new ChatServiceError('Failed to update chat session');
    }
  }

  async deleteChatSession(sessionId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw new ChatServiceError(error.message, error.code);
    } catch (error) {
      if (error instanceof ChatServiceError) throw error;
      throw new ChatServiceError('Failed to delete chat session');
    }
  }

  private mapToChatMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      text: dbMessage.message_text,
      isUser: dbMessage.is_user,
      model: dbMessage.model_used,
      timestamp: new Date(dbMessage.created_at),
      category: dbMessage.category as Message['category'],
      codeBlocks: dbMessage.metadata?.codeBlocks || [],
      quickReplies: dbMessage.metadata?.quickReplies || []
    };
  }
}

export const chatService = new ChatService();