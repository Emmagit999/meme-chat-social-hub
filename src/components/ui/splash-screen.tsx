
import React from "react";
import AppLogo from "./logo";

const SplashScreen = () => {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gradient-to-br from-memeGreen to-yellow-100 animate-fade-in">
      <AppLogo size={120} />
      <h1 className="mt-6 text-4xl font-bold text-yellow-500 drop-shadow-lg">Meme Chat Social Hub</h1>
    </div>
  );
};

export default SplashScreen;
