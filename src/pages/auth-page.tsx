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
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        
        const userData = {
          id: "1",
          username: email.split('@')[0],
          displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
          avatar: "/assets/avatar1.jpg",
          isPro: false
        };
        
        login(userData);
        toast.success("Login successful!");
        navigate('/');
      } else {
        await signUpWithEmail(email, password, username);
        
        const userData = {
          id: Date.now().toString(),
          username: username || email.split('@')[0],
          displayName: username ? (username.charAt(0).toUpperCase() + username.slice(1)) : 
                      (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
          email: email,
          avatar: "/assets/avatar3.jpg",
          isPro: false
        };
        
        login(userData);
        toast.success("Account created successfully!");
        navigate('/');
      }
    } catch (error) {
      toast.error("Authentication failed. Please try again.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      await signInWithGoogle();
      
      const userData = {
        id: "google_user_1",
        username: "google_user",
        displayName: "Google User",
        email: "google@example.com",
        avatar: "/assets/avatar2.jpg",
        isPro: true
      };
      
      login(userData);
      toast.success("Google sign in successful!");
      navigate('/');
    } catch (error) {
      toast.error("Google sign in failed. Please try again.");
      console.error("Google sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

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
