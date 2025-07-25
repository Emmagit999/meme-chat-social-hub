
import React from "react";
import AppLogo from "./logo";
import loadingGif from "@/assets/loading-animation.gif";

const SplashScreen = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gradient-to-br from-memeGreen to-yellow-100 animate-fade-in">
      <AppLogo size={120} />
      <div className="mt-6 text-8xl">😂</div>
      <div className="mt-8 flex flex-col items-center">
        <img 
          src={loadingGif} 
          alt="Loading..." 
          className="w-16 h-16 object-contain animate-pulse"
        />
        <p className="mt-4 text-yellow-600 font-medium">Loading your experience...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
