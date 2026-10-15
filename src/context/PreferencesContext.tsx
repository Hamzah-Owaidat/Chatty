"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { DEFAULT_FONT_ID, FontId, ensureFontLoaded } from "@/lib/fonts";

export interface Preferences {
  // true = Enter sends the message (Shift+Enter is a no-op, single-line input); false =
  // Ctrl/Cmd+Enter sends instead, plain Enter does nothing.
  sendOnEnter: boolean;
  messageDensity: "comfortable" | "compact";
  // Images/videos only — audio and documents always stay tap-to-download regardless.
  autoDownloadMedia: boolean;
  accentTheme: "teal" | "indigo" | "rose" | "amber" | "forest";
  fontFamily: FontId;
  fontScale: "small" | "medium" | "large";
  // Manual override, independent of (and OR'd with) the OS's prefers-reduced-motion.
  reduceMotion: boolean;
  chatWallpaper: "none" | "dots" | "diagonal" | "wash";
  // "tailed" = today's asymmetric-corner bubbles; "rounded" = uniform corners, no tail.
  bubbleShape: "tailed" | "rounded";
  bubbleFill: "gradient" | "solid";
}

// Matches today's actual behavior exactly, so nothing changes until someone visits Settings.
const DEFAULT_PREFERENCES: Preferences = {
  sendOnEnter: true,
  messageDensity: "comfortable",
  autoDownloadMedia: false,
  accentTheme: "teal",
  fontFamily: DEFAULT_FONT_ID,
  fontScale: "medium",
  reduceMotion: false,
  chatWallpaper: "none",
  bubbleShape: "tailed",
  bubbleFill: "gradient",
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

  // Appearance preferences are applied as data-attributes on <html>, the same mechanism
  // ThemeContext already uses for dark mode — globals.css keys its accent/font/motion
  // tokens off these. A non-default font also needs its stylesheet fetched on demand.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", preferences.accentTheme);
    root.setAttribute("data-font-family", preferences.fontFamily);
    root.setAttribute("data-font-scale", preferences.fontScale);
    root.setAttribute("data-reduce-motion", String(preferences.reduceMotion));
    ensureFontLoaded(preferences.fontFamily);
  }, [preferences.accentTheme, preferences.fontFamily, preferences.fontScale, preferences.reduceMotion]);

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
