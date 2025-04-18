
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main app
    navigate("/auth");
  }, [navigate]);

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
