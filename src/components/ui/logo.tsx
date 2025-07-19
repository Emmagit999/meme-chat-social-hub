
import React from "react";

export default function AppLogo({ size = 80 }: { size?: number }) {
  return (
    <div 
      className="mx-auto rounded-[16px] border-4 border-yellow-400 shadow-gold bg-gradient-to-br from-yellow-200 to-yellow-50 flex items-center justify-center text-black font-bold text-xs"
      style={{ width: size, height: size }}
    >
      <span className="text-center leading-tight">
        MemChat<br />
        <span className="text-[0.6em]">Social App</span>
      </span>
    </div>
  );
}
