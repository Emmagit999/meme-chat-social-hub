
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
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error.message);
          setSession({ user: null, isLoading: false, isAuthenticated: false });
          return;
        }
        
        if (data.session) {
          console.log("Active session found:", data.session.user.id);
          setSession({
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              username: data.session.user.user_metadata.username,
              avatarUrl: data.session.user.user_metadata.avatar_url,
              // Map the properties to what components expect
              avatar: data.session.user.user_metadata.avatar_url,
              displayName: data.session.user.user_metadata.username,
              bio: data.session.user.user_metadata.bio || '',
              isPro: data.session.user.user_metadata.isPro || false,
            },
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          console.log("No active session found");
          setSession({ user: null, isLoading: false, isAuthenticated: false });
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err);
        setSession({ user: null, isLoading: false, isAuthenticated: false });
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.id);
      
      if (currentSession) {
        setSession({
          user: {
            id: currentSession.user.id,
            email: currentSession.user.email,
            username: currentSession.user.user_metadata.username,
            avatarUrl: currentSession.user.user_metadata.avatar_url,
            // Map the properties to what components expect
            avatar: currentSession.user.user_metadata.avatar_url,
            displayName: currentSession.user.user_metadata.username,
            bio: currentSession.user.user_metadata.bio || '',
            isPro: currentSession.user.user_metadata.isPro || false,
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
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error.message);
        toast.error(error.message || 'Failed to sign in');
        throw error;
      }
      
      console.log("Sign in successful:", data?.user?.id);
      toast.success('Successfully signed in!');
      return data;
    } catch (error) {
      console.error("Sign in exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      console.log("Attempting to sign up with email:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      if (error) {
        console.error("Sign up error:", error.message);
        toast.error(error.message || 'Failed to sign up');
        throw error;
      }
      
      console.log("Sign up successful:", data?.user?.id);
      toast.success('Successfully signed up! Please check your email for verification.');
      return data;
    } catch (error) {
      console.error("Sign up exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Attempting to sign in with Google");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error("Google sign in error:", error.message);
        toast.error(error.message || 'Failed to sign in with Google');
        throw error;
      }
      
      console.log("Google sign in initiated");
      return data;
    } catch (error) {
      console.error("Google sign in exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error.message);
        toast.error(error.message || 'Failed to sign out');
        throw error;
      }
      
      console.log("Sign out successful");
      // Ensure state is updated on sign out
      setSession({ user: null, isLoading: false, isAuthenticated: false });
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error("Sign out exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  // Updated login function with better handling
  const login = (userData: AuthUser, session: any) => {
    console.log("Manual login called with userData:", userData);
    
    if (!userData || !userData.id) {
      console.error("Invalid user data provided to login function");
      toast.error("Login failed: Invalid user data");
      return;
    }
    
    // Update local storage to match App.tsx expectations
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Update auth context state
    setSession({
      user: userData,
      isLoading: false,
      isAuthenticated: true,
    });
    
    console.log("Login successful, auth state updated");
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
