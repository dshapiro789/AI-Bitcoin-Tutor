import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { useSubscriptionStore } from './subscriptionStore';

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
        // Check if user is premium or admin
        const { user } = useAuthStore.getState();
        const { subscription } = useSubscriptionStore.getState();
        const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');
        
        // Premium users have unlimited access
        if (isPremium) return true;

        const limit = get().limits[userId];
        if (!limit) return true;

        const now = Date.now();
        const hourAgo = now - 3600000; // 1 hour in milliseconds

        // Reset counter if it's been more than an hour
        if (limit.lastReset < hourAgo) {
          set((state) => ({
            limits: {
              ...state.limits,
              [userId]: {
                messageCount: 0,
                lastReset: now,
                hourlyLimit: 15
              }
            }
          }));
          return true;
        }

        return limit.messageCount < limit.hourlyLimit;
      },

      incrementCount: (userId: string) => {
        // Don't increment count for premium users
        const { user } = useAuthStore.getState();
        const { subscription } = useSubscriptionStore.getState();
        const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');
        
        if (isPremium) return;

        const now = Date.now();
        set((state) => ({
          limits: {
            ...state.limits,
            [userId]: {
              messageCount: (state.limits[userId]?.messageCount || 0) + 1,
              lastReset: state.limits[userId]?.lastReset || now,
              hourlyLimit: 15
            }
          }
        }));
      },

      getRemainingMessages: (userId: string) => {
        // Check if user is premium or admin
        const { user } = useAuthStore.getState();
        const { subscription } = useSubscriptionStore.getState();
        const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');
        
        // Premium users have unlimited messages
        if (isPremium) return Infinity;

        const limit = get().limits[userId];
        if (!limit) return 15;

        const now = Date.now();
        const hourAgo = now - 3600000;

        if (limit.lastReset < hourAgo) {
          return 15;
        }

        return Math.max(0, limit.hourlyLimit - limit.messageCount);
      }
    }),
    {
      name: 'chat-limits'
    }
  )
);