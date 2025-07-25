
import React from "react";
import AppLogo from "./logo";
import loadingGif from "@/assets/loading-animation.gif";

const SplashScreen = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gradient-to-br from-memeGreen to-yellow-100 animate-fade-in">
      <h1 className="text-4xl font-bold text-black mb-8">MEMES</h1>
      <div className="text-[120px] mb-8">😂</div>
      <div className="flex flex-col items-center">
        <img 
          src={loadingGif} 
          alt="Loading..." 
          className="w-24 h-24 object-contain"
        />
        <p className="mt-4 text-yellow-600 font-medium">Loading your experience...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
