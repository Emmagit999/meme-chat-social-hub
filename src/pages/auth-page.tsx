
import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { TriangleIcon } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#121212]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <TriangleIcon className="h-12 w-12 text-memeGreen mb-2" />
          <h1 className="text-3xl font-bold text-memeGreen">Memes Official</h1>
          <p className="text-muted-foreground mt-1">Connect through humor</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
          {isLoginView ? (
            <LoginForm onToggleForm={() => setIsLoginView(false)} />
          ) : (
            <RegisterForm onToggleForm={() => setIsLoginView(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
