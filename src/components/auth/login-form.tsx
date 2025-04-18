
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { FcGoogle } from "react-icons/fc";

export const LoginForm = ({ onToggleForm }: { onToggleForm: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(username, password);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // In a real app, implement Google login
    alert("Google login would be implemented here");
  };

  const handlePhoneLogin = () => {
    // In a real app, implement phone login
    alert("Phone login would be implemented here");
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
        <Button variant="outline" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2">
          <FcGoogle className="h-5 w-5" />
          Google
        </Button>
        <Button variant="outline" onClick={handlePhoneLogin}>
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
