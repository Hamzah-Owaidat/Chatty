"use client";
import { useEffect, useState } from "react";
import { usePreferences } from "@/context/PreferencesContext";

/**
 * True when the OS prefers reduced motion OR the user turned it on manually in Settings.
 * CSS handles almost all animation on its own (see globals.css's [data-reduce-motion]
 * sweep) — this hook exists only for the handful of call sites JS controls directly:
 * Element.scrollTo({behavior:"smooth"}) ignores any CSS override, so those need to read
 * this and pass "auto" instead.
 */
export function useReducedMotion(): boolean {
  const { preferences } = usePreferences();
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOsReduced(mql.matches);

    const handleChange = () => setOsReduced(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return osReduced || preferences.reduceMotion;
}
