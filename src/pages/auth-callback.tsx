
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SplashScreen from "@/components/ui/splash-screen";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("Processing authentication...");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback - processing URL params:', window.location.search);
        
        // Get error parameter if exists
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          setError(`Authentication error: ${errorDescription || errorParam}`);
          toast.error(`Authentication error: ${errorDescription || errorParam}`);
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }
        
        // Check for type parameter to determine the flow
        const type = searchParams.get('type');
        console.log('Auth callback type:', type);
        
        // Handle email confirmation
        if (type === 'email_confirmation') {
          setMessage("Email confirmed successfully! Redirecting to login...");
          toast.success("Email confirmed successfully!");
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
        
        // Handle password recovery - redirect to reset password page
        if (type === 'recovery') {
          console.log('Password recovery callback detected');
          setMessage("Password reset link verified! Redirecting to password reset page...");
          
          // Get the session which contains the recovery token
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error during recovery:', sessionError);
            throw new Error('Invalid or expired reset link');
          }
          
          if (session && session.user) {
            console.log('Valid recovery session found, redirecting to reset password page');
            // Redirect to the reset password page - the session will contain the recovery token
            navigate('/auth/reset-password');
            return;
          } else {
            throw new Error('Invalid or expired reset link');
          }
        }
        
        // Handle other auth flows (OAuth callbacks, etc.)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          setMessage("Authentication successful! Redirecting...");
          toast.success("Authentication successful!");
          navigate('/home');
        } else {
          throw new Error('No valid session found');
        }
        
      } catch (err) {
        console.error("Auth callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => navigate('/auth'), 3000);
      }
    };
    
    handleCallback();
  }, [searchParams, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] p-4">
      <SplashScreen />
      <div className="mt-8 text-center">
        <h2 className="text-xl font-bold text-memeGreen mb-2">
          {error ? "Authentication Error" : "Processing..."}
        </h2>
        <p className="text-muted-foreground">
          {error || message}
        </p>
        {error && (
          <p className="text-xs text-muted-foreground mt-2">
            Redirecting to login page in a few seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
