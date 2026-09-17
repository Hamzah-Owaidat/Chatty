"use client";

import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";

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
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== "loading" && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 flex items-center justify-center rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
