import { useState, useEffect } from "react";
import { History, Copy, Check, TriangleAlert, Trash2 } from "lucide-react";
import Card from "../../components/Card";
import MicAlert from "../../components/MicAlert";
import { historyDb } from "../../../shared/historyDb";
import type { EchoWriteHistoryEntry } from "../../../shared/types";
import { t } from "../../../shared/i18n";

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(timestamp));
}

function ConfirmClearDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <TriangleAlert size={18} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{t("historyConfirmClearTitle")}</h3>
        </div>
        <p className="text-sm text-gray-500">
          {t("historyConfirmClearDesc")}
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            {t("actionCancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
          >
            {t("actionClearAll")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EchoWriteHistory() {
  const [entries, setEntries] = useState<EchoWriteHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fadingId, setFadingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    historyDb.echowrite.orderBy("timestamp").reverse().toArray().then((rows) => {
      setEntries(rows);
      setLoaded(true);
    });
  }, []);

  async function copyEntry(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setFadingId(null);
      setTimeout(() => setFadingId(id), 1500);
      setTimeout(() => { setCopiedId(null); setFadingId(null); }, 2000);
    } catch { /* ignore clipboard errors */ }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await historyDb.echowrite.delete(id);
    setEntries((prev) => prev.filter((en) => en.id !== id));
  }

  async function confirmClear() {
    await historyDb.echowrite.clear();
    setEntries([]);
    setShowClearConfirm(false);
  }

  return (
    <>
      {showClearConfirm && (
        <ConfirmClearDialog
          onConfirm={() => void confirmClear()}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      <div className="my-4 w-full md:max-w-2xl md:mx-auto space-y-4">
        <MicAlert />
        <Card
          title={t("navHistory")}
          icon={History}
          iconColor="#6366f1"
          actions={
            entries.length > 0 ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-full transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                {t("actionClearAll")}
              </button>
            ) : undefined
          }
        >
          <p className="text-sm text-gray-500">
            {t("historyCardDesc")}
          </p>
        </Card>

        {!loaded ? (
          <p className="text-sm text-gray-400 py-2">{t("statusLoading")}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            {t("historyNoneYet")}
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                onClick={() => void copyEntry(entry.id, entry.text)}
                className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {entry.mode}
                  </span>
                  <div className="flex items-center gap-2">
                    <time className="text-xs text-gray-400">
                      {formatRelativeTime(entry.timestamp)}
                    </time>
                    <button
                      onClick={(e) => { e.stopPropagation(); void copyEntry(entry.id, entry.text); }}
                      className={`transition-colors cursor-pointer ${copiedId === entry.id ? "text-green-500" : "text-gray-300 hover:text-indigo-500"}`}
                      aria-label={t("ariaCopyToClipboard")}
                    >
                      {copiedId === entry.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={(e) => void handleDelete(e, entry.id)}
                      className="text-lg leading-none text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label={t("ariaDeleteEntry")}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{entry.text}</p>
                <span className="text-xs mt-3 flex items-center gap-1.5">
                  <Copy size={12} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">{t("labelClickToCopy")}</span>
                  {copiedId === entry.id && (
                    <span className={`text-green-500 transition-opacity ml-2 duration-500 ${fadingId === entry.id ? "opacity-0" : "opacity-100"}`}>
                      {t("labelCopied")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
