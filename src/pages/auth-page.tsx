
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { TriangleIcon } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to home if already authenticated
    if (isAuthenticated) {
      console.log("AuthPage - User already authenticated, redirecting to home");
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  // If already authenticated, don't render anything (useEffect will redirect)
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#121212]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <TriangleIcon className="h-12 w-12 text-memeGreen mb-2" />
          <h1 className="text-3xl font-bold text-memeGreen">Memes Official</h1>
          <p className="text-muted-foreground mt-1">Connect through humor</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLogin ? (
              <LoginForm onToggleForm={toggleForm} />
            ) : (
              <RegisterForm onToggleForm={toggleForm} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
