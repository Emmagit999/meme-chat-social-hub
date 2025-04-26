
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
        
        // Handle email confirmation
        if (type === 'email_confirmation') {
          setMessage("Email confirmed successfully! Redirecting to login...");
          toast.success("Email confirmed successfully!");
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
        
        // Handle password recovery
        if (type === 'recovery') {
          const accessToken = searchParams.get('access_token');
          if (accessToken) {
            // Redirect to reset password page with token
            navigate(`/auth/reset-password?token=${accessToken}`);
            return;
          }
        }
        
        // Handle other auth flows (OAuth callbacks, etc.)
        const { error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setMessage("Authentication successful! Redirecting...");
        toast.success("Authentication successful!");
        navigate('/home');
        
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
        toast.error("Authentication failed. Please try again.");
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
          {error ? "Authentication Error" : "Authenticating..."}
        </h2>
        <p className="text-muted-foreground">
          {error || message}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
