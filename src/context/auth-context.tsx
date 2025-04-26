import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthSession, AuthUser } from '@/types/auth';
import { toast } from 'sonner';

interface AuthData {
  user: any;
  session: any;
}

interface AuthContextType extends AuthSession {
  signInWithEmail: (email: string, password: string) => Promise<AuthData | null>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<AuthData | null>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  login: (userData: AuthUser, session: any) => void;
  register: (username: string, email: string, password: string) => Promise<AuthData | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
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
          
          // Check if email is verified before setting user as authenticated
          const isEmailVerified = data.session.user.email_confirmed_at || 
                                 data.session.user.app_metadata?.provider !== 'email' || 
                                 data.session.user.app_metadata?.email_verified;
          
          if (!isEmailVerified) {
            console.log("User email not verified");
            toast.error("Please verify your email before continuing");
            await supabase.auth.signOut();
            setSession({ user: null, isLoading: false, isAuthenticated: false });
            return;
          }
          
          // Email is verified, set session
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
        // Check if email is verified for email provider
        const isEmailVerified = currentSession.user.email_confirmed_at || 
                               currentSession.user.app_metadata?.provider !== 'email' ||
                               currentSession.user.app_metadata?.email_verified;
                               
        if (!isEmailVerified && event !== 'SIGNED_OUT') {
          console.log("User email not verified in auth change");
          toast.error("Please verify your email before continuing");
          await supabase.auth.signOut();
          setSession({ user: null, isLoading: false, isAuthenticated: false });
          return;
        }
        
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

  const signInWithEmail = async (email: string, password: string): Promise<AuthData | null> => {
    try {
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error.message);
        toast.error(error.message || 'Failed to sign in');
        return null;
      }
      
      // Check if email is verified for email logins
      if (!data.user.email_confirmed_at) {
        toast.error("Please verify your email before signing in");
        await supabase.auth.signOut();
        return null;
      }
      
      console.log("Sign in successful:", data?.user?.id);
      toast.success('Successfully signed in!');
      return data;
    } catch (error) {
      console.error("Sign in exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      return null;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string): Promise<AuthData | null> => {
    try {
      console.log("Attempting to sign up with email:", email);
      
      // First check if user already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', email)
        .maybeSingle();
      
      if (existingUsers) {
        toast.error("Email already registered");
        throw new Error("Email already registered. Please use a different email or log in.");
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error("Sign up error:", error.message);
        toast.error(error.message || 'Failed to sign up');
        throw error;
      }
      
      // If the user already exists, Supabase will return identities
      if (data?.user?.identities && data.user.identities.length === 0) {
        toast.error("Email already registered");
        throw new Error("Email already registered. Please use a different email or log in.");
      }
      
      if (!data.user) {
        console.error("Sign up failed: No user data returned");
        toast.error('Signup failed: No user data returned');
        throw new Error("Registration failed: No user data returned");
      }
      
      console.log("Sign up successful:", data?.user?.id);
      toast.success('Successfully signed up! Please check your email for verification.');
      
      // Since we want email verification, sign out the user
      await supabase.auth.signOut();
      setSession({ user: null, isLoading: false, isAuthenticated: false });
      
      return null; // Return null to indicate that email verification is required
    } catch (error) {
      console.error("Sign up exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign up');
      throw error; // Rethrow to allow the component to handle it
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
      
      // Clear local storage items related to user data
      localStorage.removeItem("user");
      
    } catch (error) {
      console.error("Sign out exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        console.error("Password reset error:", error.message);
        toast.error(error.message || 'Failed to send password reset email');
        return false;
      }
      
      toast.success('Password reset email sent. Please check your inbox.');
      return true;
    } catch (error) {
      console.error("Password reset exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email');
      return false;
    }
  };

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

  const register = async (username: string, email: string, password: string) => {
    try {
      return await signUpWithEmail(email, password, username);
    } catch (error) {
      // Let the component handle the error
      throw error;
    }
  };
  
  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        ...session,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        login,
        register,
        logout,
        resetPassword,
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
