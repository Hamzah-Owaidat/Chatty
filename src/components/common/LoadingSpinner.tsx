"use client";

import React from "react";
import clsx from "clsx";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"; // 🔹 Control size
  fullScreen?: boolean; // 🔹 For full-page loading state
  text?: string; // 🔹 Optional label text
}

export default function LoadingSpinner({
  size = "md",
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  };

  const spinner = (
    <div
      className={clsx(
        "animate-spin rounded-full border-t-transparent border-[#1a7b9b]",
        sizeClasses[size]
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-stone-900">
        {spinner}
        {text && <p className="mt-3 text-gray-600 dark:text-gray-300">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {spinner}
      {text && <span className="text-gray-600 dark:text-gray-300">{text}</span>}
    </div>
  );
}
