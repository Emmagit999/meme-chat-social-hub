
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from '@/types/auth';
import { toast } from 'sonner';

interface AuthSession {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthSession {
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  login: (userData: AuthUser, session: any) => void;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (userData: Partial<AuthUser>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to initialize auth from storage
const initializeAuthFromStorage = (): AuthSession => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return { 
        user: JSON.parse(storedUser), 
        isLoading: false, 
        isAuthenticated: true 
      };
    }
  } catch (error) {
    console.error("Error loading auth from storage:", error);
    localStorage.removeItem('user');
  }
  return { user: null, isLoading: true, isAuthenticated: false };
};

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession>(initializeAuthFromStorage());

  // Handle auth session initialization and changes
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.id);
      
      // Fix: Changed the comparison to properly check if event is "SIGNED_OUT"
      if (event === "SIGNED_OUT") {
        setSession({ user: null, isLoading: false, isAuthenticated: false });
        localStorage.removeItem("user");
        return;
      }
      
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
        
        // Get user profile from database
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
            
          const userData: AuthUser = {
            id: currentSession.user.id,
            email: currentSession.user.email,
            username: profile?.username || currentSession.user.user_metadata?.username,
            avatar: profile?.avatar_url || currentSession.user.user_metadata?.avatar_url,
            avatarUrl: profile?.avatar_url || currentSession.user.user_metadata?.avatar_url,
            displayName: profile?.username || currentSession.user.user_metadata?.username,
            bio: profile?.bio || '',
            isPro: profile?.is_pro || false,
          };
          
          localStorage.setItem("user", JSON.stringify(userData));
          
          setSession({
            user: userData,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setSession({
            user: {
              id: currentSession.user.id,
              email: currentSession.user.email,
              username: currentSession.user.user_metadata?.username,
              avatar: currentSession.user.user_metadata?.avatar_url,
              avatarUrl: currentSession.user.user_metadata?.avatar_url,
              displayName: currentSession.user.user_metadata?.username,
              bio: '',
              isPro: false,
            },
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else {
        setSession({ user: null, isLoading: false, isAuthenticated: false });
      }
    });

    // Check active session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Error getting session:", error.message);
        setSession({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }
      
      if (!data.session) {
        console.log("No active session found");
        setSession({ user: null, isLoading: false, isAuthenticated: false });
      }
      // Session will be handled by onAuthStateChange
    });

    return () => subscription.unsubscribe();
  }, []);

  // Authentication methods
  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error.message);
        toast.error(error.message || 'Failed to sign in');
        throw error;
      }
      
      // Success is handled by the auth state change listener
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
      
      // First check if username already exists
      const { data: existingUsernames } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (existingUsernames) {
        toast.error("Username already taken");
        throw new Error("Username already taken. Please choose a different username.");
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=email_confirmation`
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
      
      return data;
    } catch (error) {
      console.error("Sign up exception:", error);
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
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      
      if (error) {
        console.error("Password reset error:", error.message);
        toast.error(error.message || 'Failed to send password reset email');
        throw error;
      }
      
      toast.success('Password reset email sent. Please check your inbox.');
      return true;
    } catch (error) {
      console.error("Password reset exception:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email');
      return false;
    }
  };

  const login = (userData: AuthUser, authSession: any) => {
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
  
  const updateProfile = async (userData: Partial<AuthUser>): Promise<boolean> => {
    try {
      if (!session.user) {
        throw new Error("No user logged in");
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          username: userData.username,
          bio: userData.bio,
          avatar_url: userData.avatar || userData.avatarUrl
        })
        .eq('id', session.user.id);
        
      if (error) throw error;
      
      // Update local user data
      const updatedUser = {
        ...session.user,
        ...userData
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Update auth context state
      setSession({
        ...session,
        user: updatedUser
      });
      
      toast.success("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      return false;
    }
  };
  
  const refreshUser = async () => {
    if (!session.user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      
      if (profile) {
        const updatedUser: AuthUser = {
          ...session.user,
          username: profile.username || session.user.username,
          displayName: profile.username || session.user.displayName,
          avatar: profile.avatar_url || session.user.avatar,
          avatarUrl: profile.avatar_url || session.user.avatarUrl,
          bio: profile.bio || session.user.bio,
          isPro: profile.is_pro || session.user.isPro
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setSession({
          ...session,
          user: updatedUser
        });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
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
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
