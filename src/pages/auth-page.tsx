
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { TriangleIcon, Chrome } from 'lucide-react';
import { toast } from "sonner";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to home if already authenticated
    if (isAuthenticated) {
      console.log("AuthPage - User already authenticated, redirecting to home");
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("AuthPage - Form submitted:", isLogin ? "login" : "signup");
      
      if (isLogin) {
        const authData = await signInWithEmail(email, password);
        console.log("AuthPage - Login successful:", authData);
        
        if (!authData || !authData.user) {
          throw new Error("Authentication failed or no user data returned");
        }
        
        const userData = {
          id: authData.user.id,
          username: authData.user.user_metadata?.username || email.split('@')[0],
          displayName: authData.user.user_metadata?.username || 
                      (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
          email: authData.user.email || email,
          avatar: authData.user.user_metadata?.avatar_url || "/assets/avatar1.jpg",
          isPro: authData.user.user_metadata?.isPro || false
        };
        
        // Use the userData object and auth data session
        login(userData, authData.session);
        toast.success("Login successful!");
        
        // Add a small delay to allow state updates to propagate
        setTimeout(() => {
          navigate('/');
        }, 300);
      } else {
        const authData = await signUpWithEmail(email, password, username);
        console.log("AuthPage - Signup successful:", authData);
        
        if (!authData || !authData.user) {
          throw new Error("Sign up failed or no user data returned");
        }
        
        const userData = {
          id: authData.user.id,
          username: username || email.split('@')[0],
          displayName: username ? (username.charAt(0).toUpperCase() + username.slice(1)) : 
                      (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
          email: authData.user.email || email,
          avatar: "/assets/avatar3.jpg",
          isPro: false
        };
        
        // Use the userData object and auth data session
        login(userData, authData.session);
        toast.success("Account created successfully!");
        
        // Add a small delay to allow state updates to propagate
        setTimeout(() => {
          navigate('/');
        }, 300);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      console.log("AuthPage - Attempting Google sign in");
      const data = await signInWithGoogle();
      
      // Google sign-in is handled by redirects, so this part will not execute immediately
      // For demo purposes only
      if (data && data.provider === 'google') {
        toast.success("Google sign in initiated!");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error(error instanceof Error ? error.message : "Google sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, don't render anything (useEffect will redirect)
  if (isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#121212]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <TriangleIcon className="h-12 w-12 text-memeGreen mb-2" />
          <h1 className="text-3xl font-bold text-memeGreen">Memes Official</h1>
          <p className="text-muted-foreground mt-1">Connect through humor</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Welcome back!' : 'Create an account'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Sign up for a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="coolmemer123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-memeGreen hover:bg-memeGreen/90"
                disabled={loading}
              >
                {loading
                  ? 'Loading...'
                  : isLogin
                  ? 'Sign in'
                  : 'Create account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
