
import React from 'react';
import { AuthProvider as CustomAuthProvider } from '@/hooks/use-auth';

// This is now just a wrapper around our custom hook implementation
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <CustomAuthProvider>{children}</CustomAuthProvider>;
};

// Re-export useAuth hook for backward compatibility
export { useAuth } from '@/hooks/use-auth';
