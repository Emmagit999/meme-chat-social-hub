
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Chrome, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const LoginForm = ({ 
  onToggleForm, 
  onResetPassword 
}: { 
  onToggleForm: () => void;
  onResetPassword: () => void;
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    identifier: '',
    password: '',
  });
  const { signInWithEmailOrUsername } = useAuth();
  const navigate = useNavigate();

  // Form validation functions
  const validateIdentifier = (value: string) => {
    if (!value) return "Email or username is required";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    return "";
  };

  const validateForm = () => {
    const errors = {
      identifier: validateIdentifier(identifier),
      password: validatePassword(password),
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
      console.log("Login form - Attempting to sign in with:", identifier);
      
      // Use signInWithEmailOrUsername and handle null response
      const authData = await signInWithEmailOrUsername(identifier, password);
      console.log("Login form - Sign in successful, auth data:", authData);
      
      if (!authData || !authData.user) {
        throw new Error("Authentication failed or no user data returned");
      }
      
      // Successfully logged in, navigation will happen through auth listener
      // Force a small delay before navigation to ensure state is updated
      setTimeout(() => {
        navigate('/home');
      }, 300);
    } catch (error) {
      console.error("Login failed", error);
      toast.error(error instanceof Error ? error.message : "Login failed. Please check your credentials.");
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid login')) {
          toast.error("Invalid email/username or password. Please try again.");
        } else if (error.message.includes('email') || error.message.includes('username')) {
          setFormErrors(prev => ({ ...prev, identifier: error.message }));
        } else if (error.message.includes('password')) {
          setFormErrors(prev => ({ ...prev, password: error.message }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // For demo login, use email/password method with default credentials
      const authData = await signInWithEmailOrUsername("demo@example.com", "password123");
      
      if (authData && authData.user) {
        toast.success("Demo login successful!");
        
        // Navigation will happen via auth state change listener
      } else {
        throw new Error("Demo login failed");
      }
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
          <Label htmlFor="identifier">Email or Username</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="your@email.com or @username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setFormErrors(prev => ({ ...prev, identifier: '' }));
            }}
            required
            className={formErrors.identifier ? "border-red-500" : ""}
            disabled={isLoading}
          />
          {formErrors.identifier && (
            <p className="text-red-500 text-xs mt-1">{formErrors.identifier}</p>
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
            }}
            required
            className={formErrors.password ? "border-red-500" : ""}
            disabled={isLoading}
          />
          {formErrors.password && (
            <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
          )}
          <div className="text-right">
            <button 
              type="button"
              onClick={onResetPassword} 
              className="text-xs text-memeGreen hover:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-memeGreen hover:bg-memeGreen/90" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
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
          disabled={isLoading}
        >
          <Chrome className="h-5 w-5" />
          Google
        </Button>
        <Button 
          variant="outline" 
          onClick={handlePhoneLogin}
          disabled={isLoading}
        >
          Phone
        </Button>
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          onClick={onToggleForm}
          className="text-memeGreen hover:underline font-medium"
          type="button"
          disabled={isLoading}
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
