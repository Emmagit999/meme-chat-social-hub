
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const LoginForm = ({ onToggleForm }: { onToggleForm: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Login form - Attempting to sign in with:", username);
      
      // Use signInWithEmail instead of login directly
      const authData = await signInWithEmail(username, password);
      console.log("Login form - Sign in successful, auth data:", authData);
      
      if (!authData || !authData.user) {
        throw new Error("Authentication successful but no user data returned");
      }
      
      // Create a user object from auth data
      const userData = {
        id: authData.user.id,
        username: authData.user.user_metadata?.username || username.split('@')[0],
        displayName: authData.user.user_metadata?.username || 
                    (username.split('@')[0].charAt(0).toUpperCase() + username.split('@')[0].slice(1)),
        email: authData.user.email || username,
        avatar: authData.user.user_metadata?.avatar_url || "/assets/avatar1.jpg",
        isPro: authData.user.user_metadata?.isPro || false
      };
      
      // Call login with the user data object and auth data session
      login(userData, authData.session);
      
      console.log("Login form - Updated user context, navigating to home");
      toast.success("Login successful!");
      
      // Force a small delay before navigation to ensure state is updated
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error("Login failed", error);
      toast.error(error instanceof Error ? error.message : "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithEmail("demo@example.com", "password123");
      toast.success("Demo login successful!");
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error("Demo login failed", error);
      toast.error("Demo login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = () => {
    toast.info("Phone login not implemented yet");
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Memes Official</h1>
        <p className="text-muted-foreground">Login to continue memeing</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="meme_lord"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" className="w-full bg-memeGreen hover:bg-memeGreen/90" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={handleGoogleLogin} 
          className="flex items-center justify-center gap-2"
        >
          <Chrome className="h-5 w-5" /> {/* Replace FcGoogle with Chrome icon */}
          Google
        </Button>
        <Button 
          variant="outline" 
          onClick={handlePhoneLogin}
        >
          Phone
        </Button>
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          onClick={onToggleForm}
          className="text-memeGreen hover:underline font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
