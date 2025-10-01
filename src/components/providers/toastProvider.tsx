"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#333",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: "8px",
          fontWeight: 500,
        },
        success: {
          style: { background: "#22c55e" },
        },
        error: {
          style: { background: "#ef4444" },
        },
        loading: {
          style: { background: "#2563eb" },
        },
      }}
    />
  );
}
