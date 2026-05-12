import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { t } from "../../shared/i18n";

interface Props {
  voices: { name: string; lang: string }[];
  value: string | undefined;
  onChange: (value: string) => void;
  dropUp?: boolean;
}

export default function VoiceSelect({ voices, value, onChange, dropUp = false }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = voices.find((v) => v.name === value) ?? voices[0];
  const filtered = search
    ? voices.filter(
        (v) =>
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.lang.toLowerCase().includes(search.toLowerCase())
      )
    : voices;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  if (voices.length === 0) {
    return <p className="text-xs text-gray-400">{t("voiceSelectLoading")}</p>;
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => { if (!open) { setSearch(""); setTimeout(() => searchRef.current?.focus(), 0); } setOpen((o) => !o); }}
        className="flex items-center gap-2 w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 cursor-pointer"
      >
        <span className="flex-1 text-left truncate">{selected?.name ?? t("voiceSelectPlaceholder")}</span>
        {selected && <span className="text-gray-400 text-xs shrink-0">{selected.lang}</span>}
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className={`absolute z-50 w-full rounded-lg border border-gray-200 bg-white shadow-lg ${dropUp ? "bottom-full mb-1" : "mt-1"}`}>
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("voiceSearchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">{t("selectNoResults")}</li>
            )}
            {filtered.map((v) => (
              <li key={v.name}>
                <button
                  type="button"
                  onClick={() => select(v.name)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer ${
                    v.name === selected?.name ? "text-indigo-600 font-medium" : "text-gray-900"
                  }`}
                >
                  <span className="flex-1 text-left truncate">{v.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{v.lang}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
