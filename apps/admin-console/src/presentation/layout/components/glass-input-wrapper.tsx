import React from "react";

export const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[#1B4B7C]/50 transition-colors focus-within:border-[#1B4B7C]/80 mt-2">
    {children}
  </div>
);