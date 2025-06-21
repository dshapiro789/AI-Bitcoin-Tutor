import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface ChatSession {
  id: string;
  title: string;
  lastMessagePreview: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useChatHistory() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadChatSessions = async () => {
    if (!user) {
      setChatSessions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const sessions: ChatSession[] = data.map(session => ({
          id: session.id,
          title: session.title,
          lastMessagePreview: session.last_message_preview || 'No messages yet',
          messageCount: session.message_count || 0,
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at)
        }));
        setChatSessions(sessions);
      } else {
        setChatSessions([]);
      }
    } catch (err) {
      console.error('Error loading chat sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    if (!user) return [];

    try {
      const { data: messages, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return messages || [];
    } catch (err) {
      console.error('Error loading chat session:', err);
      throw err;
    }
  };

  const renameChatSession = async (sessionId: string, newTitle: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setChatSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, title: newTitle, updatedAt: new Date() }
            : session
        )
      );
    } catch (err) {
      console.error('Failed to rename chat session:', err);
      throw err;
    }
  };

  const deleteChatSession = async (sessionId: string) => {
    if (!user) return;

    try {
      // Deleting the session from chat_sessions will cascade delete messages from chat_history
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      console.error('Error deleting chat session:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      loadChatSessions();
    } else {
      setChatSessions([]);
    }
  }, [user]);

  return {
    chatSessions,
    isLoading,
    error,
    loadChatSessions,
    loadChatSession,
    renameChatSession,
    deleteChatSession
  };
}