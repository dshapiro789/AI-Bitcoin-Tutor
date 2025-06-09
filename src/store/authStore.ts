import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSubscriptionStore } from './subscriptionStore';

interface User {
  id: string;
  email: string | undefined;
  createdAt: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, subscriptionPlan?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  signUp: async (email: string, password: string, subscriptionPlan?: string) => {
    try {
      // First check if user exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (existingUser.user) {
        // User exists, throw specific error
        throw new Error('This email is already registered. Please sign in instead.');
      }

      // If user doesn't exist, proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Set admin status for specific email
      const isAdmin = email === 'dshapiro789@gmail.com';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at || new Date().toISOString(),
        isAdmin
      };

      // If signing up with a subscription plan, create the subscription
      if (subscriptionPlan) {
        const { createSubscription } = useSubscriptionStore.getState();
        await createSubscription(subscriptionPlan, user.id);
      }

      set({ user });
    } catch (err) {
      console.error('Error creating user:', err);
      throw err instanceof Error ? err : new Error('Failed to create user');
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Set admin status for specific email
      const isAdmin = email === 'dshapiro789@gmail.com';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at || new Date().toISOString(),
        isAdmin
      };
      set({ user });
    } catch (err) {
      console.error('Error signing in:', err);
      throw err instanceof Error ? err : new Error('Failed to sign in');
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } catch (err) {
      console.error('Error signing out:', err);
      throw new Error('Failed to sign out');
    }
  },

  restoreSession: async () => {
    try {
      set({ loading: true });

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        // Set admin status for specific email
        const isAdmin = session.user.email === 'dshapiro789@gmail.com';

        const user: User = {
          id: session.user.id,
          email: session.user.email,
          createdAt: session.user.created_at || new Date().toISOString(),
          isAdmin
        };
        set({ user });
      }
    } catch (err) {
      console.error('Error restoring session:', err);
    } finally {
      set({ loading: false });
    }
  }
}));