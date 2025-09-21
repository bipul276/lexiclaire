import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type LangKey = "en" | "hi" | "pa";

type Prefs = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;

  contrast: number; // 100–140
  setContrast: (v: number) => void;

  fontSize: number; // 12–22
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

  // Load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.darkMode === "boolean") setDarkMode(saved.darkMode);
        if (typeof saved.contrast === "number") setContrast(saved.contrast);
        if (typeof saved.fontSize === "number") setFontSize(saved.fontSize);
        if (saved.language) setLanguage(saved.language);
        if (typeof saved.reducedMotion === "boolean") setReducedMotion(saved.reducedMotion);
      }
    } catch {}
  }, []);

  // Persist and reflect to <html>
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ darkMode, contrast, fontSize, language, reducedMotion })
    );

    const root = document.documentElement;

    // theme
    root.classList.toggle("dark", darkMode);

    // font size (base rem sizing)
    root.style.setProperty("--lexi-font-size", `${fontSize}px`);

    // contrast multiplier for design tokens (optional usage)
    root.style.setProperty("--lexi-contrast", `${contrast}%`);

    // reduced motion
    if (reducedMotion) root.classList.add("reduced-motion");
    else root.classList.remove("reduced-motion");
  }, [darkMode, contrast, fontSize, language, reducedMotion]);

  const resetPrefs = () => {
    setDarkMode(DEFAULTS.darkMode);
    setContrast(DEFAULTS.contrast);
    setFontSize(DEFAULTS.fontSize);
    setLanguage(DEFAULTS.language);
    setReducedMotion(DEFAULTS.reducedMotion);
  };

  const value = useMemo(
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
