
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const user = localStorage.getItem("user");
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };

    // Simulate loading time
    setTimeout(checkAuth, 1500);
  }, []);

  // Auth context value
  const auth = {
    user: isAuthenticated ? JSON.parse(localStorage.getItem("user") || "{}") : null,
    login: (userData: any) => {
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);
    },
    logout: () => {
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    },
    isAuthenticated,
  };

  // Protected route component that redirects if not logged in
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" />;
    }
    return <>{children}</>;
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        <DataProvider>
          <Router>
            {isAuthenticated && <Navbar />}
            <div className="pt-4">
              <Routes>
                <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/merge" element={<ProtectedRoute><MergePage /></ProtectedRoute>} />
                <Route path="/roast" element={<ProtectedRoute><RoastPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </DataProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
