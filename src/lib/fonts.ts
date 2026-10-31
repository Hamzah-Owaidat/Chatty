// Catalog of selectable Appearance fonts. "outfit" is the default and is self-hosted via
// next/font (see src/app/layout.tsx) — eager, optimized, loaded for every visitor. The other
// nine are plain Google Fonts, loaded on demand via ensureFontLoaded() only once a visitor
// actually picks one (or opens the Settings font picker, which wants to preview them all).
export type FontId =
  | "outfit"
  | "inter"
  | "poppins"
  | "manrope"
  | "spaceGrotesk"
  | "nunito"
  | "plusJakarta"
  | "workSans"
  | "lexend"
  | "quicksand";

export interface FontOption {
  id: FontId;
  label: string;
  // Google Fonts CSS2 API `family` query value.
  googleFontsFamily: string;
  // Resolved CSS font-family value, with a sane generic fallback.
  cssValue: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "outfit", label: "Outfit", googleFontsFamily: "Outfit:wght@400;500;600;700", cssValue: "'Outfit', sans-serif" },
  { id: "inter", label: "Inter", googleFontsFamily: "Inter:wght@400;500;600;700", cssValue: "'Inter', sans-serif" },
  { id: "poppins", label: "Poppins", googleFontsFamily: "Poppins:wght@400;500;600;700", cssValue: "'Poppins', sans-serif" },
  { id: "manrope", label: "Manrope", googleFontsFamily: "Manrope:wght@400;500;600;700", cssValue: "'Manrope', sans-serif" },
  { id: "spaceGrotesk", label: "Space Grotesk", googleFontsFamily: "Space+Grotesk:wght@400;500;600;700", cssValue: "'Space Grotesk', sans-serif" },
  { id: "nunito", label: "Nunito", googleFontsFamily: "Nunito:wght@400;500;600;700", cssValue: "'Nunito', sans-serif" },
  { id: "plusJakarta", label: "Plus Jakarta Sans", googleFontsFamily: "Plus+Jakarta+Sans:wght@400;500;600;700", cssValue: "'Plus Jakarta Sans', sans-serif" },
  { id: "workSans", label: "Work Sans", googleFontsFamily: "Work+Sans:wght@400;500;600;700", cssValue: "'Work Sans', sans-serif" },
  { id: "lexend", label: "Lexend", googleFontsFamily: "Lexend:wght@400;500;600;700", cssValue: "'Lexend', sans-serif" },
  { id: "quicksand", label: "Quicksand", googleFontsFamily: "Quicksand:wght@400;500;600;700", cssValue: "'Quicksand', sans-serif" },
];

export const DEFAULT_FONT_ID: FontId = "outfit";

export function getFontOption(id: FontId): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

// "outfit" is always already loaded (next/font, eager) — never re-fetched as a plain stylesheet.
const loadedFonts = new Set<FontId>(["outfit"]);

/** Injects a Google Fonts stylesheet <link> for this font, once per session. No-op if loaded already. */
export function ensureFontLoaded(id: FontId): void {
  if (typeof document === "undefined" || loadedFonts.has(id)) return;
  loadedFonts.add(id);

  const option = getFontOption(id);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${option.googleFontsFamily}&display=swap`;
  document.head.appendChild(link);
}

/** Loads every font's stylesheet — used once by the Settings font picker so every option previews correctly. */
export function ensureAllFontsLoaded(): void {
  FONT_OPTIONS.forEach((f) => ensureFontLoaded(f.id));
}
