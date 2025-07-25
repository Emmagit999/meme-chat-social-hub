
import React from "react";
import AppLogo from "./logo";
import loadingGif from "@/assets/loading-animation.gif";

const SplashScreen = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gradient-to-br from-memeGreen to-yellow-100 animate-fade-in">
      {/* Cool logo-style MEMES text */}
      <div className="relative mb-12">
        <h1 className="text-8xl font-black text-transparent bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 bg-clip-text drop-shadow-2xl tracking-wider">
          MEMES
        </h1>
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 rounded-lg blur opacity-25 animate-pulse"></div>
      </div>
      
      <div className="flex flex-col items-center">
        <img 
          src={loadingGif} 
          alt="Loading..." 
          className="w-32 h-32 object-contain"
        />
        <p className="mt-6 text-green-700 font-bold text-lg">Loading your experience...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
