import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ColorMode = "light" | "dark";

function getInitialMode(storageKey: string, defaultMode: ColorMode): ColorMode {
  if (typeof window === "undefined") return defaultMode;
  const saved = window.localStorage.getItem(storageKey);
  if (saved === "light" || saved === "dark") return saved;
  return defaultMode;
}

const ColorModeContext = createContext<{
  mode: ColorMode;
  toggle: () => void;
  setMode: (m: ColorMode) => void;
}>({
  mode: "light",
  toggle: () => {},
  setMode: () => {},
});

export function ColorModeProvider({
  children,
  storageKey = "color-mode",
  defaultMode = "light",
}: {
  children: ReactNode;
  /** مفتاح localStorage — استخدم مفتاح مختلف للأدمن عن المتجر عشان يفضلوا مستقلين */
  storageKey?: string;
  defaultMode?: ColorMode;
}) {
  const [mode, setModeState] = useState<ColorMode>(() => getInitialMode(storageKey, defaultMode));

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [mode]);

  const setMode = (m: ColorMode) => {
    setModeState(m);
    window.localStorage.setItem(storageKey, m);
  };

  const toggle = () => setMode(mode === "dark" ? "light" : "dark");

  return (
    <ColorModeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
