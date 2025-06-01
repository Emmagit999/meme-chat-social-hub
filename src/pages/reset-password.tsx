
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TriangleIcon, Loader2, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid recovery session
    const validateRecoverySession = async () => {
      try {
        setIsInitializing(true);
        console.log('Checking for recovery session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session validation error:", error);
          setIsValid(false);
          setValidationMessage("Invalid or expired reset link. Please request a new password reset.");
          return;
        }
        
        if (session && session.user) {
          console.log('Valid recovery session found for user:', session.user.email);
          setIsValid(true);
          setValidationMessage("Reset link verified. You can now set your new password.");
        } else {
          console.log('No valid recovery session found');
          setIsValid(false);
          setValidationMessage("Invalid or expired reset link. Please request a new password reset.");
        }
      } catch (err) {
        console.error("Error validating recovery session:", err);
        setIsValid(false);
        setValidationMessage("An error occurred. Please try requesting a new password reset.");
      } finally {
        setIsInitializing(false);
      }
    };

    validateRecoverySession();
  }, []);

  const validatePassword = (pass: string) => {
    if (pass.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-z])/.test(pass)) return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(pass)) return "Password must contain at least one uppercase letter";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Validation
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Attempting to update password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      toast.success("Password updated successfully! You can now log in with your new password.");
      
      // Sign out to ensure user needs to log in with new password
      await supabase.auth.signOut();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(errorMessage);
      setPasswordError(errorMessage);
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
              {isInitializing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-memeGreen mb-4" />
                  <p className="text-center text-muted-foreground">
                    Verifying your reset link...
                  </p>
                </div>
              ) : !isValid ? (
                <div className="text-center py-6">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
                  <p className="text-muted-foreground mb-4">
                    {validationMessage}
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-memeGreen hover:bg-memeGreen/90"
                  >
                    Request New Reset Link
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
                    <p className="text-muted-foreground">
                      Choose a strong password for your account
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        required
                        minLength={6}
                        className={passwordError ? "border-red-500" : ""}
                      />
                      {passwordError && (
                        <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters with uppercase and lowercase letters
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmPasswordError('');
                        }}
                        required
                        className={confirmPasswordError ? "border-red-500" : ""}
                      />
                      {confirmPasswordError && (
                        <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
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
                          Updating Password...
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
