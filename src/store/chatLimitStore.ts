import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatLimit {
  messageCount: number;
  lastReset: number;
  hourlyLimit: number;
}

interface ChatLimitStore {
  limits: Record<string, ChatLimit>;
  checkLimit: (userId: string) => boolean;
  incrementCount: (userId: string) => void;
  getRemainingMessages: (userId: string) => number;
}

export const useChatLimitStore = create<ChatLimitStore>()(
  persist(
    (set, get) => ({
      limits: {},
      
      checkLimit: (userId: string) => {
        // All users now have unlimited access
        return true;
      },

      incrementCount: (userId: string) => {
        // No longer tracking message counts - all users have unlimited access
        return;
      },

      getRemainingMessages: (userId: string) => {
        // All users have unlimited messages
        return Infinity;
      }
    }),
    {
      name: 'chat-limits'
    }
  )
);