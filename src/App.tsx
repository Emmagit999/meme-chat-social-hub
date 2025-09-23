
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import ChangePassword from "@/pages/change-password";
import AuthCallback from "@/pages/auth-callback";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsPage from "@/pages/notifications-page";
import PostDetailPage from "@/pages/post-detail-page";
import AboutPage from "@/pages/about-page";
import SettingsPage from "@/pages/settings-page";
import OpaySupport from "@/pages/opay-support";
import SupportPage from "@/pages/support-page";
import AdminDashboard from "@/pages/admin-dashboard";
import { usePalRequests } from "@/hooks/use-pal-requests";
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications";
import { useRealTimeSync } from "@/hooks/use-real-time-sync";
import { useOptimizedPresence } from "@/hooks/use-optimized-presence";
import { useNetworkOptimizer } from "@/hooks/use-network-optimizer";
import { useBackgroundSync } from "@/hooks/use-background-sync";
import { useWakeOnInteraction } from "@/hooks/use-wake-on-interaction";
import { useConnectionOptimizer } from "@/hooks/use-connection-optimizer";
import { useAggressiveCaching } from "@/hooks/use-aggressive-caching";
import { useEnhancedNotifications } from '@/hooks/use-enhanced-notifications';

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

// Create a context for sharing pal request count with the navbar
export const PalRequestContext = React.createContext<number>(0);

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const { requestCount } = usePalRequests();
  
  // Initialize optimized networking features
  useRealTimeNotifications();
  useRealTimeSync();
  useOptimizedPresence();
  useNetworkOptimizer();
  useBackgroundSync();
  useWakeOnInteraction();
  useConnectionOptimizer();
  useAggressiveCaching();
  useEnhancedNotifications();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return (
    <PalRequestContext.Provider value={requestCount}>
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
            path="/change-password" 
            element={<ChangePassword />} 
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
            element={<PostDetailPage />} 
          />
          <Route 
            path="/chat" 
            element={<AuthCheck><ChatPage /></AuthCheck>} 
          />
          <Route 
            path="/about" 
            element={<AboutPage />} 
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
          <Route 
            path="/settings" 
            element={<AuthCheck><SettingsPage /></AuthCheck>} 
          />
          <Route 
            path="/support" 
            element={<SupportPage />} 
          />
          <Route 
            path="/opay-support" 
            element={<OpaySupport />} 
          />
          <Route 
            path="/admin" 
            element={<AuthCheck><AdminDashboard /></AuthCheck>} 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </PalRequestContext.Provider>
  );
};

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 3500); // Show splash screen for 3.5 seconds
    
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
