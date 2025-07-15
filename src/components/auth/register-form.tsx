
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const RegisterForm = ({ onToggleForm }: { onToggleForm: () => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { register } = useAuth();

  // Form validation functions
  const validateUsername = (value: string) => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters long";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers and underscores";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email address";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters long";
    return "";
  };

  const validateConfirmPassword = (pass: string, confirm: string) => {
    if (!confirm) return "Please confirm your password";
    if (pass !== confirm) return "Passwords do not match";
    return "";
  };

  const validateForm = () => {
    const errors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword)
    };
    
    setFormErrors(errors);
    
    // Return true if no errors (all values are empty strings)
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await register(username, email, password);
      
      // If we get here, registration was successful
      setSuccess('Registration successful! Please check your email to confirm your account. This step is required before you can log in and start using the app.');
      toast.success('Check your email for confirmation link - you must confirm to continue!');
      
      // Clear the form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle email already registered error
      if (error.message?.includes('already registered')) {
        setFormErrors(prev => ({ 
          ...prev, 
          email: 'This email is already registered. Try logging in or resetting your password.' 
        }));
        toast.error('Email already registered');
      } else if (error.message?.includes('username already taken')) {
        setFormErrors(prev => ({ 
          ...prev, 
          username: 'Username already taken. Please choose another one.' 
        }));
        toast.error('Username already taken');
      } else {
        toast.error(error.message || 'Registration failed');
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
      
      {success ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-md p-4">
          <p className="text-green-500">{success}</p>
          <Button 
            onClick={onToggleForm} 
            className="w-full mt-4 bg-memeGreen hover:bg-memeGreen/90"
          >
            Go to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="meme_lord"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFormErrors(prev => ({ ...prev, username: '' }));
              }}
              className={formErrors.username ? "border-red-500" : ""}
              required
              minLength={3}
              disabled={isLoading}
            />
            {formErrors.username && (
              <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="meme@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormErrors(prev => ({ ...prev, email: '' }));
              }}
              className={formErrors.email ? "border-red-500" : ""}
              required
              disabled={isLoading}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormErrors(prev => ({ ...prev, password: '' }));
                if (confirmPassword) {
                  setFormErrors(prev => ({ 
                    ...prev, 
                    confirmPassword: validateConfirmPassword(e.target.value, confirmPassword)
                  }));
                }
              }}
              className={formErrors.password ? "border-red-500" : ""}
              required
              minLength={6}
              disabled={isLoading}
            />
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFormErrors(prev => ({ 
                  ...prev, 
                  confirmPassword: validateConfirmPassword(password, e.target.value)
                }));
              }}
              className={formErrors.confirmPassword ? "border-red-500" : ""}
              required
              disabled={isLoading}
            />
            {formErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-memeGreen hover:bg-memeGreen/90" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </Button>
        </form>
      )}
      
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={onToggleForm}
          className="text-memeGreen hover:underline font-medium"
          type="button"
          disabled={isLoading}
        >
          Log in
        </button>
      </p>
    </div>
  );
};
