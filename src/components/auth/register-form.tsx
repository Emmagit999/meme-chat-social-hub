
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export const RegisterForm = ({ onToggleForm }: { onToggleForm: () => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register(username, email, password);
      
      // If we get here, registration was successful
      setSuccess('Registration successful! Please check your email to verify your account before logging in.');
      toast.success('Check your email for verification link');
      
      // Clear the form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle email already registered error
      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Try logging in or resetting your password.');
        toast.error('Email already registered');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
        toast.error('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
        <p className="text-muted-foreground">Join the meme revolution</p>
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
            minLength={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="meme@example.com"
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
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        {success && (
          <div className="text-green-500 text-sm">{success}</div>
        )}
        
        <Button type="submit" className="w-full bg-memeGreen hover:bg-memeGreen/90" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
      
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={onToggleForm}
          className="text-memeGreen hover:underline font-medium"
          type="button"
        >
          Log in
        </button>
      </p>
    </div>
  );
};
