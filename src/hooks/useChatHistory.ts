import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  createdAt: Date;
}

export function useChatHistory() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadChatSessions = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all chat messages grouped by session (we'll use date-based grouping)
      const { data: messages, error: messagesError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        setChatSessions([]);
        return;
      }

      // Group messages by day to create sessions
      const sessionMap = new Map<string, any[]>();
      
      messages.forEach(message => {
        const messageDate = new Date(message.created_at);
        const sessionKey = messageDate.toDateString(); // Group by day
        
        if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, []);
        }
        sessionMap.get(sessionKey)!.push(message);
      });

      // Convert to ChatSession objects
      const sessions: ChatSession[] = Array.from(sessionMap.entries()).map(([dateKey, sessionMessages]) => {
        const sortedMessages = sessionMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const firstMessage = sortedMessages[0];
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        
        // Generate title from first user message or use date
        let title = `Chat from ${new Date(dateKey).toLocaleDateString()}`;
        const firstUserMessage = sortedMessages.find(m => m.is_user);
        if (firstUserMessage && firstUserMessage.message_text) {
          const messageText = firstUserMessage.message_text.trim();
          title = messageText.length > 50 
            ? messageText.substring(0, 50) + '...' 
            : messageText;
        }

        return {
          id: `session_${dateKey}`,
          title,
          lastMessage: lastMessage.message_text.length > 100 
            ? lastMessage.message_text.substring(0, 100) + '...'
            : lastMessage.message_text,
          lastMessageTime: new Date(lastMessage.created_at),
          messageCount: sessionMessages.length,
          createdAt: new Date(firstMessage.created_at)
        };
      });

      // Sort by last message time (most recent first)
      sessions.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      
      setChatSessions(sessions);
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
      // Extract date from session ID
      const dateKey = sessionId.replace('session_', '');
      const sessionDate = new Date(dateKey);
      
      // Get start and end of day
      const startOfDay = new Date(sessionDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(sessionDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: messages, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      return messages || [];
    } catch (err) {
      console.error('Error loading chat session:', err);
      throw err;
    }
  };

  const renameChatSession = async (sessionId: string, newTitle: string) => {
    // For now, we'll just update the local state since we're using date-based grouping
    // In a real implementation, you might want to store session metadata separately
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle }
          : session
      )
    );
  };

  const deleteChatSession = async (sessionId: string) => {
    if (!user) return;

    try {
      // Extract date from session ID
      const dateKey = sessionId.replace('session_', '');
      const sessionDate = new Date(dateKey);
      
      // Get start and end of day
      const startOfDay = new Date(sessionDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(sessionDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

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