
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthSession, AuthUser } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType extends AuthSession {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Adding aliases to match component usage - adding explicit parameters to match usage
  login: (userData: AuthUser, session: any) => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession({
          user: {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata.username,
            avatarUrl: session.user.user_metadata.avatar_url,
            // Map the properties to what components expect
            avatar: session.user.user_metadata.avatar_url,
            displayName: session.user.user_metadata.username,
            bio: session.user.user_metadata.bio || '',
            isPro: session.user.user_metadata.isPro || false,
          },
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setSession({ user: null, isLoading: false, isAuthenticated: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setSession({
          user: {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata.username,
            avatarUrl: session.user.user_metadata.avatar_url,
            // Map the properties to what components expect
            avatar: session.user.user_metadata.avatar_url,
            displayName: session.user.user_metadata.username,
            bio: session.user.user_metadata.bio || '',
            isPro: session.user.user_metadata.isPro || false,
          },
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setSession({ user: null, isLoading: false, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Successfully signed in!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      if (error) throw error;
      toast.success('Successfully signed up! Please check your email for verification.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://preview--meme-chat-social-hub.lovable.app/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully signed out!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  // Updated login function to accept two parameters
  const login = (userData: AuthUser, session: any) => {
    setSession({
      user: userData,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  // Create alias functions to match component usage
  const register = (username: string, email: string, password: string) => 
    signUpWithEmail(email, password, username);
  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        ...session,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        // Add aliases to match component usage
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
