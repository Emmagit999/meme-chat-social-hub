
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import HomePage from "@/pages/home-page";
import MergePage from "@/pages/merge-page";
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
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsPage from "@/pages/notifications-page";
import PostDetailPage from "@/pages/post-detail-page";

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

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return (
    <>
      {isAuthenticated && <Navbar />}
      <div className={`
        ${isAuthenticated ? (isMobile ? 'pt-2 px-2' : 'pt-16 px-4') : ''}
        ${isMobile ? 'pb-20' : ''}
      `}>
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
            path="/profile" 
            element={<AuthCheck><ProfilePage /></AuthCheck>} 
          />
          <Route 
            path="/profile/:userId" 
            element={<AuthCheck><ProfilePage /></AuthCheck>} 
          />
          <Route 
            path="/post/:postId" 
            element={<AuthCheck><PostDetailPage /></AuthCheck>} 
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
            path="/notifications" 
            element={<AuthCheck><NotificationsPage /></AuthCheck>} 
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
  const isMobile = useIsMobile();

  useEffect(() => {
    // Request notification permission as early as possible
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <SplashScreen />;
  }

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-16' : ''}`}>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
            <Toaster 
              position={isMobile ? "bottom-center" : "top-center"} 
              closeButton 
              richColors 
            />
          </Router>
        </DataProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
