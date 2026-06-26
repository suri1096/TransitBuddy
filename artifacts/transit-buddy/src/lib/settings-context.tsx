import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TextSize = "Small" | "Medium" | "Large" | "Extra Large";
type FontType = "Default" | "Dyslexia-Friendly";
type ThemeType = "Standard" | "Low-Stimulation" | "High Contrast";
export type UnitsType = "imperial" | "metric";

export function formatDist(meters: number, units: UnitsType): string {
  if (units === "imperial") {
    const feet = meters * 3.28084;
    if (feet < 528) return `${Math.round(feet)} ft`;
    return `${(feet / 5280).toFixed(1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

interface SettingsState {
  textSize: TextSize;
  font: FontType;
  theme: ThemeType;
  isDark: boolean;
  units: UnitsType;
  setTextSize: (size: TextSize) => void;
  setFont: (font: FontType) => void;
  setTheme: (theme: ThemeType) => void;
  setIsDark: (dark: boolean) => void;
  setUnits: (u: UnitsType) => void;
}

const SettingsContext = createContext<SettingsState>({
  textSize: "Medium",
  font: "Default",
  theme: "Standard",
  isDark: false,
  units: "imperial",
  setTextSize: () => {},
  setFont: () => {},
  setTheme: () => {},
  setIsDark: () => {},
  setUnits: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>("Medium");
  const [font, setFont] = useState<FontType>("Default");
  const [theme, setTheme] = useState<ThemeType>("Standard");
  const [isDark, setIsDark] = useState(false);
  const [units, setUnitsState] = useState<UnitsType>(() => {
    try { return (localStorage.getItem("transitbuddy_units") as UnitsType) ?? "imperial"; } catch { return "imperial"; }
  });

  const setUnits = (u: UnitsType) => {
    setUnitsState(u);
    try { localStorage.setItem("transitbuddy_units", u); } catch {}
  };

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    const sizeMap: Record<TextSize, string> = {
      "Small": "14px",
      "Medium": "16px",
      "Large": "18px",
      "Extra Large": "21px",
    };
    root.style.fontSize = sizeMap[textSize];

    if (font === "Dyslexia-Friendly") {
      root.style.letterSpacing = "0.05em";
      root.style.wordSpacing = "0.12em";
      root.style.lineHeight = "1.7";
    } else {
      root.style.letterSpacing = "";
      root.style.wordSpacing = "";
      root.style.lineHeight = "";
    }

    if (theme === "High Contrast") {
      root.style.setProperty("--primary", "220 90% 40%");
      if (isDark) {
        root.style.setProperty("--background", "0 0% 5%");
        root.style.setProperty("--foreground", "0 0% 100%");
        root.style.setProperty("--muted-foreground", "0 0% 82%");
      } else {
        root.style.setProperty("--background", "0 0% 100%");
        root.style.setProperty("--foreground", "0 0% 0%");
        root.style.setProperty("--muted-foreground", "0 0% 20%");
      }
    } else if (theme === "Low-Stimulation") {
      root.style.setProperty("--primary", "180 20% 50%");
      if (isDark) {
        root.style.setProperty("--background", "220 16% 14%");
        root.style.setProperty("--foreground", "210 20% 82%");
        root.style.setProperty("--muted-foreground", "210 14% 55%");
      } else {
        root.style.setProperty("--background", "180 10% 97%");
        root.style.setProperty("--foreground", "180 15% 25%");
        root.style.setProperty("--muted-foreground", "180 12% 42%");
      }
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--muted-foreground");
    }
  }, [textSize, font, theme, isDark]);

  return (
    <SettingsContext.Provider value={{ textSize, font, theme, isDark, units, setTextSize, setFont, setTheme, setIsDark, setUnits }}>
      {children}
    </SettingsContext.Provider>
  );
}
