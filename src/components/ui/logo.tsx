
import React from "react";
import logo from "/uploads/user_uploaded_image_1.png"; // The user-uploaded image (used as the logo)

export default function AppLogo({ size = 80 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="App Logo"
      style={{ width: size, height: size, objectFit: "contain" }}
      className="mx-auto rounded-[16px] border-4 border-yellow-400 shadow-gold"
    />
  );
}
