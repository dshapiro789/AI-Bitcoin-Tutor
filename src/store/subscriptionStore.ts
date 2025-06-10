import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'none' | 'active_until_period_end';

interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionState {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  checkAccess: (feature: string) => boolean;
  loadSubscription: () => Promise<void>;
  createSubscription: (priceId: string, customerId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  createCustomerPortalSession: () => Promise<string>;
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
    
    // If subscription is set to cancel at period end, check if we're still within the period
    if (subscription?.cancelAtPeriodEnd && subscription?.endDate) {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      return now < endDate && (subscription.status === 'active' || subscription.status === 'active_until_period_end');
    }
    
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
        subscription: data ? {
          tier: data.tier,
          status: data.status,
          startDate: data.start_date,
          endDate: data.end_date,
          stripeCustomerId: data.stripe_customer_id,
          stripePriceId: data.stripe_price_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          cancelAtPeriodEnd: data.cancel_at_period_end
        } : { 
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

      const { subscription } = get();
      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Call the edge function to cancel subscription at period end
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription-at-period-end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      // Reload subscription data to reflect the changes
      await get().loadSubscription();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel subscription' });
      console.error('Error canceling subscription:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  createCustomerPortalSession: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: `${window.location.origin}/account`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if this is a Stripe configuration error
        if (errorData.error && errorData.error.includes('No configuration provided')) {
          throw new Error('Billing portal is temporarily unavailable. Please contact support for assistance with your subscription.');
        }
        
        throw new Error(errorData.error || 'Failed to create customer portal session');
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      console.error('Error creating customer portal session:', err);
      throw err;
    }
  }
}));