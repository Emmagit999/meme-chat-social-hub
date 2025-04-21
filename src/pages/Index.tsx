
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if authentication check is complete
    if (!isLoading) {
      console.log("Index page - Auth state:", isAuthenticated ? "authenticated" : "not authenticated");
      
      // Redirect based on authentication status
      if (isAuthenticated) {
        console.log("Index page - Redirecting to /home");
        navigate("/home");
      } else {
        console.log("Index page - Redirecting to /auth");
        navigate("/auth");
      }
    }
  }, [navigate, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-memeBlack">
      <div className="animate-pulse-subtle">
        <h1 className="text-4xl font-bold text-memeGreen">Memes Official</h1>
        <p className="text-center mt-2 text-white">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
