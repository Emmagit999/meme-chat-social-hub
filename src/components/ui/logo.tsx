
import React from "react";
// Use a relative path or import from public directory instead of /uploads
import { defaultLogo } from "@/assets/index";

export default function AppLogo({ size = 80 }: { size?: number }) {
  // Try to get the uploaded image from the user object or environment
  // For now, use the default logo as we don't have access to the actual uploaded image
  const logoSrc = defaultLogo;

  return (
    <img
      src={logoSrc}
      alt="App Logo"
      style={{ width: size, height: size, objectFit: "contain" }}
      className="mx-auto rounded-[16px] border-4 border-yellow-400 shadow-gold"
    />
  );
}
