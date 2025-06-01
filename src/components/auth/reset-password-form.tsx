
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const ResetPasswordForm = ({ onToggleLogin }: { onToggleLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const [emailError, setEmailError] = useState('');

  // Basic email validation
  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email address";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    
    // Validate email
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Sending password reset email to:', email);
      const result = await resetPassword(email);
      
      if (result) {
        setSuccess(true);
        toast.success('Password reset email sent! Check your inbox for a link to reset your password.', {
          duration: 8000
        });
      } else {
        toast.error('Failed to send reset email. Please check if the email is registered.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.');
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
            ? "Check your email for a password reset link. Click the link to set a new password." 
            : "Enter your email to receive a password reset link"
          }
        </p>
      </div>
      
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              required
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
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
                Sending Reset Email...
              </>
            ) : (
              "Send Password Reset Email"
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              📧 Password reset email sent successfully! 
              <br />
              Please check your email and click the reset link to create a new password.
            </p>
          </div>
          <Button 
            onClick={onToggleLogin} 
            variant="outline"
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
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
