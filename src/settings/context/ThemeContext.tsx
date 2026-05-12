import { createContext, useContext, useEffect, useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    void getStorage("theme").then((saved) => {
      const resolved: Theme = saved === "dark" ? "dark" : "light";
      setThemeState(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    void setStorage("theme", newTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
