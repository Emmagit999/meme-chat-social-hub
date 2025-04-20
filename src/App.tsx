
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/auth-context";
import { DataProvider } from "./context/data-context";
import { Navbar } from "./components/layout/navbar";

import AuthPage from "./pages/auth-page";
import HomePage from "./pages/home-page";
import MergePage from "./pages/merge-page";
import RoastPage from "./pages/roast-page";
import ProfilePage from "./pages/profile-page";
import ChatPage from "./pages/chat-page";
import NotFound from "./pages/NotFound";
import SplashScreen from "@/components/layout/splash-screen";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/" /> : <AuthPage />} 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/merge" 
        element={
          <ProtectedRoute>
            <MergePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/roast" 
        element={
          <ProtectedRoute>
            <RoastPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Custom splash effect: show intro screen with logo for 2s
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <AppRoutes />
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
