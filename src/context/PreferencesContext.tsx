"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

export interface Preferences {
  // true = Enter sends the message (Shift+Enter is a no-op, single-line input); false =
  // Ctrl/Cmd+Enter sends instead, plain Enter does nothing.
  sendOnEnter: boolean;
  messageDensity: "comfortable" | "compact";
  // Images/videos only — audio and documents always stay tap-to-download regardless.
  autoDownloadMedia: boolean;
}

// Matches today's actual behavior exactly, so nothing changes until someone visits Settings.
const DEFAULT_PREFERENCES: Preferences = {
  sendOnEnter: true,
  messageDensity: "comfortable",
  autoDownloadMedia: false,
};

const STORAGE_KEY = "chatty-preferences";

type PreferencesContextType = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
    } catch {
      // Corrupt/blocked storage — fall back to defaults.
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Storage full/blocked — preference still applies for this session.
    }
  }, [preferences, isInitialized]);

  const setPreference: PreferencesContextType["setPreference"] = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return <PreferencesContext.Provider value={{ preferences, setPreference }}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
