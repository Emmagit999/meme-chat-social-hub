
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import HomePage from "@/pages/home-page";
import MergePage from "@/pages/merge-page";
import RoastPage from "@/pages/roast-page";
import ProfilePage from "@/pages/profile-page";
import ChatPage from "@/pages/chat-page";
import SearchPage from "@/pages/search-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import SplashScreen from "@/components/ui/splash-screen";
import PalsPage from "@/pages/pals-page";
import { useAuth } from "@/hooks/use-auth";
import Index from "@/pages/Index";
import ResetPassword from "@/pages/reset-password";
import AuthCallback from "@/pages/auth-callback";

// Create an AuthCheck component that uses the auth context
const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
};

// Create a component for the app routes to use the auth context
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return (
    <>
      {isAuthenticated && <Navbar />}
      <div className={`${isAuthenticated ? 'pt-4' : ''}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route 
            path="/auth" 
            element={!isAuthenticated ? <AuthPage /> : <Navigate to="/home" />} 
          />
          <Route 
            path="/auth/reset-password" 
            element={<ResetPassword />} 
          />
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
          />
          <Route 
            path="/home" 
            element={<AuthCheck><HomePage /></AuthCheck>} 
          />
          <Route 
            path="/merge" 
            element={<AuthCheck><MergePage /></AuthCheck>} 
          />
          <Route 
            path="/roast" 
            element={<AuthCheck><RoastPage /></AuthCheck>} 
          />
          <Route 
            path="/profile" 
            element={<AuthCheck><ProfilePage /></AuthCheck>} 
          />
          <Route 
            path="/profile/:userId" 
            element={<AuthCheck><ProfilePage /></AuthCheck>} 
          />
          <Route 
            path="/chat" 
            element={<AuthCheck><ChatPage /></AuthCheck>} 
          />
          <Route 
            path="/search" 
            element={<AuthCheck><SearchPage /></AuthCheck>} 
          />
          <Route 
            path="/pals" 
            element={<AuthCheck><PalsPage /></AuthCheck>} 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate a brief loading time for splash screen
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
            <Toaster position="top-center" closeButton richColors />
          </Router>
        </DataProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
