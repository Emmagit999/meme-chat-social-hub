
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import SplashScreen from "@/components/ui/splash-screen";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if authentication check is complete
    if (!isLoading) {
      console.log("Index page - Auth state:", isAuthenticated ? "authenticated" : "not authenticated");
      
      // Redirect based on authentication status with a slight delay
      // to ensure all auth state is properly updated
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          console.log("Index page - Redirecting to /home");
          navigate("/home");
        } else {
          console.log("Index page - Redirecting to /auth");
          navigate("/auth");
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, isAuthenticated, isLoading]);

  // While checking auth state, show splash screen
  return <SplashScreen />;
};

export default Index;
