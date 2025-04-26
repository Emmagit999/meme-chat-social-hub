
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export const ResetPasswordForm = ({ onToggleLogin }: { onToggleLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result) {
        setSuccess(true);
        toast.success('Password reset email sent. Check your inbox!');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-muted-foreground">
          {success 
            ? "Check your email for a reset link" 
            : "Enter your email to receive a password reset link"
          }
        </p>
      </div>
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full bg-memeGreen hover:bg-memeGreen/90" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      ) : (
        <Button 
          onClick={onToggleLogin} 
          className="w-full bg-memeGreen hover:bg-memeGreen/90"
        >
          Return to Login
        </Button>
      )}
      
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <button
          onClick={onToggleLogin}
          className="text-memeGreen hover:underline font-medium"
        >
          Back to login
        </button>
      </p>
    </div>
  );
};
