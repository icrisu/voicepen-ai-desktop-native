import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Key, Mic, NotebookPen, Settings,
  ChevronDown, ChevronUp,
  Info, History, Scissors, StickyNote, Wand2, KeyRound, LifeBuoy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../components/Logo";
import { t } from "../../shared/i18n";
import { useTheme } from "../context/ThemeContext";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL as string | undefined;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary/10 text-primary"
      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
  }`;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { theme } = useTheme();
  const NAV_ITEMS = [
    { to: "/", label: t("pageTitleHome"), icon: Home, end: true },
    { to: "/api-keys", label: t("pageTitleAiApiKeys"), icon: Key, end: false },
    { to: "/settings", label: t("pageTitleSettings"), icon: Settings, end: false },
  ];

  const ECHOWRITE_SUB_ITEMS = [
    { to: "/echowrite/history",  label: t("navHistory"),  icon: History },
    { to: "/echowrite/snippets", label: t("navSnippets"), icon: Scissors },
    { to: "/echowrite/about",    label: t("navAbout"),    icon: Info },
  ];

  const NOTES_SUB_ITEMS = [
    { to: "/notes/all",   label: t("navAllNotes"), icon: StickyNote },
    { to: "/notes/about", label: t("navAbout"),    icon: Info },
  ];

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isEchoActive = pathname.startsWith("/echowrite");
  const isNotesActive = pathname.startsWith("/notes");
  const [echoOpen, setEchoOpen] = useState(isEchoActive);
  const [notesOpen, setNotesOpen] = useState(isNotesActive);
  const prevPathname = useRef(pathname);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (pathname.startsWith("/echowrite")) setEchoOpen(true);
    if (pathname.startsWith("/notes")) setNotesOpen(true);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      if (window.innerWidth < 768) onClose();
    }
  }, [pathname, onClose]);

  const handleEchoClick = () => {
    if (!echoOpen) {
      setEchoOpen(true);
      navigate("/echowrite");
    } else {
      setEchoOpen(false);
    }
  };

  const handleNotesClick = () => {
    if (!notesOpen) {
      setNotesOpen(true);
      navigate("/notes");
    } else {
      setNotesOpen(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-56 shrink-0 border-r border-outline-variant/30
      bg-surface-container-lowest overflow-y-auto transition-transform duration-300
      md:sticky md:top-0 md:h-screen md:translate-x-0
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      ${!isOpen ? "md:hidden" : ""}
    `}>
      <div className="flex items-center gap-2 px-4 py-2">
        <Logo wClass="w-8" hClass="h-8" type={theme === "dark" ? "black" : "light"} />
        <span className="text-lg font-bold tracking-tight text-on-surface">VoicePen</span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* EchoWrite with submenu */}
        <div>
          <button
            onClick={handleEchoClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isEchoActive
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <Mic size={16} />
            <span className="flex-1 text-left">{t("pageTitleEchoWrite")}</span>
            {echoOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence initial={false}>
            {echoOpen && (
              <motion.div
                key="echowrite-submenu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex flex-col gap-1 pl-4 pt-1">
                  {ECHOWRITE_SUB_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={navLinkClass}>
                      <Icon size={14} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notes with submenu */}
        <div>
          <button
            onClick={handleNotesClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isNotesActive
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <NotebookPen size={16} />
            <span className="flex-1 text-left">{t("pageTitleNotes")}</span>
            {notesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence initial={false}>
            {notesOpen && (
              <motion.div
                key="notes-submenu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex flex-col gap-1 pl-4 pt-1">
                  {NOTES_SUB_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={navLinkClass}>
                      <Icon size={14} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NavLink to="/abilities" className={navLinkClass}>
          <Wand2 size={16} />
          {t("pageTitleAbilities")}
        </NavLink>

        {NAV_ITEMS.slice(2).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <NavLink to="/activation" className={navLinkClass}>
          <KeyRound size={16} />
          {t("navVoicePenActivation")}
        </NavLink>

        {SUPPORT_URL && (
          <button
            onClick={() => window.open(SUPPORT_URL, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-on-surface-variant hover:text-on-surface hover:bg-surface-container w-full text-left"
          >
            <LifeBuoy size={16} />
            {t("navSupport")}
          </button>
        )}
      </nav>
    </aside>
    </>
  );
}
