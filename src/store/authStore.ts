import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string | undefined;
  createdAt: string;
  isAdmin: boolean;
  knowledgeLevel?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateKnowledgeLevel: (level: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,

  signUp: async (email: string, password: string) => {
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

      // Create profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: null,
          role: 'user',
          knowledge_level: null // Will trigger welcome screen
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw here as the user account was created successfully
      }

      // Set admin status for specific email
      const isAdmin = email === 'dshapiro789@gmail.com';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at || new Date().toISOString(),
        isAdmin,
        knowledgeLevel: null
      };

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

      // Get user profile including knowledge level
      const { data: profile } = await supabase
        .from('profiles')
        .select('knowledge_level')
        .eq('id', data.user.id)
        .maybeSingle();

      // Set admin status for specific email
      const isAdmin = email === 'dshapiro789@gmail.com';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at || new Date().toISOString(),
        isAdmin,
        knowledgeLevel: profile?.knowledge_level || null
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
      
      if (error) {
        // If there's an error (like session_not_found), clear the invalid session
        console.warn('Session restoration failed, clearing invalid session:', error);
        await supabase.auth.signOut();
        set({ user: null });
        return;
      }

      if (session?.user) {
        // Get user profile including knowledge level
        const { data: profile } = await supabase
          .from('profiles')
          .select('knowledge_level')
          .eq('id', session.user.id)
          .maybeSingle();

        // Set admin status for specific email
        const isAdmin = session.user.email === 'dshapiro789@gmail.com';

        const user: User = {
          id: session.user.id,
          email: session.user.email,
          createdAt: session.user.created_at || new Date().toISOString(),
          isAdmin,
          knowledgeLevel: profile?.knowledge_level || null
        };
        set({ user });
      }
    } catch (err) {
      console.error('Error restoring session:', err);
      // Clear any invalid session on unexpected errors
      try {
        await supabase.auth.signOut();
        set({ user: null });
      } catch (signOutError) {
        console.error('Error clearing invalid session:', signOutError);
      }
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://aibitcointutor.com/account?password-reset=true',
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error resetting password:', err);
      throw err instanceof Error ? err : new Error('Failed to send password reset email');
    }
  },

  updateKnowledgeLevel: async (level: string) => {
    try {
      const { user } = get();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ knowledge_level: level })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      set({ 
        user: { 
          ...user, 
          knowledgeLevel: level 
        } 
      });
    } catch (err) {
      console.error('Error updating knowledge level:', err);
      throw err instanceof Error ? err : new Error('Failed to update knowledge level');
    }
  }
}));