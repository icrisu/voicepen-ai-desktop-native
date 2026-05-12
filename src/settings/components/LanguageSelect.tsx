import { createElement, useEffect, useRef, useState, type ComponentType } from "react";
import * as Flags from "country-flag-icons/react/1x1";
import { ChevronDown, Search } from "lucide-react";
import { LANGUAGE_MAP } from "../../shared/lib/language-flag";
import { t } from "../../shared/i18n";

const langNames = new Intl.DisplayNames(["en"], { type: "language" });

const OPTIONS = LANGUAGE_MAP.map((e) => ({
  value: e.lang,
  flag: e.flag,
  label: langNames.of(e.lang) ?? e.lang,
})).sort((a, b) => a.label.localeCompare(b.label));

function FlagIcon({ code, className }: { code: string; className?: string }) {
  const Flag = (Flags as Record<string, ComponentType<{ className?: string }>>)[code];
  if (!Flag) return null;
  return createElement(Flag, { className });
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function LanguageSelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = OPTIONS.find((o) => o.value === value);
  const filtered = search
    ? OPTIONS.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase())
      )
    : OPTIONS;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative w-full max-w-xs${disabled ? " pointer-events-none opacity-40" : ""}`}>
      <button
        type="button"
        onClick={() => { if (!open) { setSearch(""); setTimeout(() => searchRef.current?.focus(), 0); } setOpen((o) => !o); }}
        className="flex items-center gap-2 w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 cursor-pointer"
      >
        {selected ? (
          <>
            <FlagIcon code={selected.flag} className="h-4 w-5 rounded-sm shrink-0 object-cover" />
            <span className="flex-1 text-left">{selected.label}</span>
            <span className="text-gray-500 text-xs">{selected.value}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-400">{t("langSelectPlaceholder")}</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("langSearchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">{t("selectNoResults")}</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => select(o.value)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer ${
                    o.value === value ? "text-indigo-600 font-medium" : "text-gray-900"
                  }`}
                >
                  <FlagIcon code={o.flag} className="h-4 w-5 rounded-sm shrink-0 object-cover" />
                  <span className="flex-1 text-left">{o.label}</span>
                  <span className="text-gray-400 text-xs">{o.value}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
