"use client";
import React from "react";
import { SiteLogo } from "@/components/svg";

const LayoutLoader = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="relative w-36 h-36">
        {/* Anel de fundo (track) */}
        <svg
          className="absolute inset-0 w-full h-full text-default-200"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        {/* Arco que gira */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-default-400"
          viewBox="0 0 100 100"
          style={{ animationDuration: "1.2s" }}
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="110 220"
          />
        </svg>

        {/* Círculo branco interno com a logo */}
        <div className="absolute inset-3 rounded-full bg-background border border-default-200 flex items-center justify-center">
          <SiteLogo className="w-16 h-16" />
        </div>
      </div>
    </div>
  );
};

export default LayoutLoader;
