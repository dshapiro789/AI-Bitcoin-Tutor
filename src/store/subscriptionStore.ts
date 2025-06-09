import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'none';

interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  stripeSubscriptionId?: string;
}

interface SubscriptionState {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  checkAccess: (feature: string) => boolean;
  loadSubscription: () => Promise<void>;
  createSubscription: (priceId: string, customerId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const PREMIUM_FEATURES = [
  'ai-chat',
  'wallet-simulator',
  'node-simulator',
  'development',
  'premium-courses'
];

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  loading: false,
  error: null,

  checkAccess: (feature: string) => {
    const { user } = useAuthStore.getState();
    
    // Admin always has access
    if (user?.isAdmin) {
      return true;
    }

    // Free features are always accessible
    if (!PREMIUM_FEATURES.includes(feature)) {
      return true;
    }

    // Premium features require active subscription
    const { subscription } = get();
    return subscription?.status === 'active' && subscription?.tier === 'premium';
  },

  loadSubscription: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ subscription: { tier: 'free', status: 'none' } });
        return;
      }

      // Check if user is admin
      const { user: authUser } = useAuthStore.getState();
      if (authUser?.isAdmin) {
        set({
          subscription: {
            tier: 'premium',
            status: 'active',
            startDate: new Date().toISOString()
          }
        });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      set({ 
        subscription: data || { 
          tier: 'free', 
          status: 'none',
          startDate: new Date().toISOString()
        }
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load subscription' });
      console.error('Error loading subscription:', err);
    } finally {
      set({ loading: false });
    }
  },

  createSubscription: async (priceId: string, customerId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'premium',
          status: 'active',
          start_date: new Date().toISOString(),
          stripe_customer_id: customerId,
          stripe_price_id: priceId
        })
        .select()
        .single();

      if (error) throw error;

      set({ subscription: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create subscription' });
      console.error('Error creating subscription:', err);
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          end_date: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await get().loadSubscription();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel subscription' });
      console.error('Error canceling subscription:', err);
    } finally {
      set({ loading: false });
    }
  }
}));