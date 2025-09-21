import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type LangKey = "en" | "hi" | "pa";

type Prefs = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;

  contrast: number; // 100–140 (%)
  setContrast: (v: number) => void;

  fontSize: number; // 12–22 (px)
  setFontSize: (v: number) => void;

  language: LangKey;
  setLanguage: (v: LangKey) => void;

  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;

  resetPrefs: () => void;
};

const PreferencesContext = createContext<Prefs | null>(null);
export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
};

const LS_KEY = "lexi-prefs";

const DEFAULTS = {
  darkMode: false,
  contrast: 100,
  fontSize: 16,
  language: "en" as LangKey,
  reducedMotion: false,
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(DEFAULTS.darkMode);
  const [contrast, setContrast] = useState(DEFAULTS.contrast);
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize);
  const [language, setLanguage] = useState<LangKey>(DEFAULTS.language);
  const [reducedMotion, setReducedMotion] = useState(DEFAULTS.reducedMotion);

  // Load once from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.darkMode === "boolean") setDarkMode(saved.darkMode);
      if (typeof saved.contrast === "number") setContrast(saved.contrast);
      if (typeof saved.fontSize === "number") setFontSize(saved.fontSize);
      if (saved.language) setLanguage(saved.language as LangKey);
      if (typeof saved.reducedMotion === "boolean") setReducedMotion(saved.reducedMotion);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist + reflect to <html> and <body>
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ darkMode, contrast, fontSize, language, reducedMotion })
    );

    const root = document.documentElement;
    const body = document.body;

    // Dark mode on both elements for compatibility
    root.classList.toggle("dark", !!darkMode);
    body.classList.toggle("dark", !!darkMode);

    // Native controls theme
    root.style.setProperty("color-scheme", darkMode ? "dark" : "light");

    // Font size token (your CSS reads --font-size)
    root.style.setProperty("--font-size", `${fontSize}px`);

    // Contrast multiplier + toggle high-contrast class
    const multiplier = Math.max(1, contrast / 100); // 1.0–1.4
    root.style.setProperty("--hc-multiplier", String(multiplier));
    root.classList.toggle("hc", contrast > 100);

    // Reduced motion
    root.classList.toggle("reduced-motion", !!reducedMotion);
  }, [darkMode, contrast, fontSize, language, reducedMotion]);

  const resetPrefs = () => {
    setDarkMode(DEFAULTS.darkMode);
    setContrast(DEFAULTS.contrast);
    setFontSize(DEFAULTS.fontSize);
    setLanguage(DEFAULTS.language);
    setReducedMotion(DEFAULTS.reducedMotion);
  };

  // ✅ This was missing: the value object you provide to the context
  const value = useMemo<Prefs>(
    () => ({
      darkMode,
      setDarkMode,
      contrast,
      setContrast,
      fontSize,
      setFontSize,
      language,
      setLanguage,
      reducedMotion,
      setReducedMotion,
      resetPrefs,
    }),
    [darkMode, contrast, fontSize, language, reducedMotion]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};
