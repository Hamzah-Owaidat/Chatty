"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  // The theme actually applied right now — "system" resolves to whichever of these is live.
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  // Flips between light/dark, breaking out of "system" with an explicit choice — same
  // "manual override beats system" convention most apps use.
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This code will only run on the client side
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "light"; // Default to light theme

    setThemeState(initialTheme);
    setSystemTheme(getSystemTheme());
    setIsInitialized(true);
  }, []);

  // Keep resolvedTheme live while on "system" if the OS theme changes mid-session.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(mql.matches ? "dark" : "light");

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      if (resolvedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, resolvedTheme, isInitialized]);

  const setTheme = (next: Theme) => setThemeState(next);

  const toggleTheme = () => {
    setThemeState(resolvedTheme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
