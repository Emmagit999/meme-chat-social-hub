
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TriangleIcon, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (!token) {
      toast.error("Missing reset token. Please request a new password reset link.");
      navigate('/auth');
      return;
    }

    // Validate the token with Supabase
    const validateToken = async () => {
      try {
        setIsLoading(true);
        // Just get the user session which will validate the token
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Token validation error:", error);
          setIsValid(false);
          setValidationMessage("Invalid or expired token. Please request a new password reset.");
          toast.error("Password reset link is invalid or has expired");
          setTimeout(() => navigate('/auth'), 3000);
        } else if (data.user) {
          setIsValid(true);
          setValidationMessage("Token valid. You can now set your new password.");
        }
      } catch (err) {
        console.error("Error validating token:", err);
        setIsValid(false);
        setValidationMessage("An error occurred validating your request.");
        toast.error("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const validatePasswordStrength = (pass: string) => {
    if (pass.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const passwordStrengthError = validatePasswordStrength(password);
    if (passwordStrengthError) {
      toast.error(passwordStrengthError);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Password updated successfully");
      // Sign out after password change to require new login
      await supabase.auth.signOut();
      setTimeout(() => navigate('/auth'), 2000);
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#121212]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <TriangleIcon className="h-12 w-12 text-memeGreen mb-2" />
          <h1 className="text-3xl font-bold text-memeGreen">Memes Official</h1>
          <p className="text-muted-foreground mt-1">Reset your password</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {isLoading && !isValid ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-memeGreen mb-4" />
                  <p className="text-center text-muted-foreground">
                    Validating your reset link...
                  </p>
                </div>
              ) : !isValid && validationMessage ? (
                <div className="text-center py-6">
                  <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
                  <p className="text-muted-foreground mb-4">
                    {validationMessage}
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-memeGreen hover:bg-memeGreen/90"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
                    <p className="text-muted-foreground">
                      Enter your new password below
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters
                      </p>
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
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-memeGreen hover:bg-memeGreen/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        className="text-memeGreen hover:underline"
                        onClick={() => navigate('/auth')}
                      >
                        Back to login
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
