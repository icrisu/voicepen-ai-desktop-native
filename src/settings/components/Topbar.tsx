import { useLocation } from "react-router-dom";
import { Menu, Sun, Moon } from "lucide-react";
import { t } from "../../shared/i18n";
import { useTheme } from "../context/ThemeContext";

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/": "pageTitleHome",
  "/api-keys": "pageTitleAiApiKeys",
  "/echowrite": "pageTitleEchoWrite",
  "/echowrite/about":   "pageTitleEchoWrite",
  "/echowrite/history": "pageTitleEchoWrite",
  "/echowrite/snippets": "pageTitleEchoWrite",
  "/echowrite/settings": "pageTitleEchoWrite",
  "/notes": "pageTitleNotes",
  "/abilities": "pageTitleAbilities",
  "/activation": "pageTitleActivation",
  "/settings": "pageTitleSettings",
};

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const key = Object.keys(PAGE_TITLE_KEYS).find(k => pathname === k || pathname.startsWith(k + "/"));
  const title = key ? t(PAGE_TITLE_KEYS[key]) : "";

  return (
    <header className="sticky top-0 z-90 border-b border-outline-variant/30 bg-transparent backdrop-blur-md">
      <div className="grid grid-cols-3 items-center px-3 py-2 min-h-[48px]">
        <button
          onClick={onToggleSidebar}
          className="justify-self-start p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <span className="justify-self-center text-lg font-semibold text-on-surface">{title}</span>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="justify-self-end p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
