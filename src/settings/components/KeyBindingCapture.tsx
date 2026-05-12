import { useEffect, useState } from "react";
import type { KeyBinding } from "../../shared/types";
import { formatKeyBinding } from "../../shared/lib/keybindings";

interface Props {
  id: string;
  label: string;
  value: KeyBinding;
  onChange: (binding: KeyBinding) => void;
}

export default function KeyBindingCapture({ id, label, value, onChange }: Props) {
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!capturing) return;
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setCapturing(false); return; }
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
      onChange({
        key: e.key,
        ctrlKey: e.ctrlKey || undefined,
        altKey: e.altKey || undefined,
        shiftKey: e.shiftKey || undefined,
        metaKey: e.metaKey || undefined,
      });
      setCapturing(false);
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [capturing, onChange]);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">{label}</label>
      <button
        id={id}
        type="button"
        onClick={() => setCapturing(true)}
        className={`px-3 py-2 rounded-lg border text-sm font-mono transition-colors cursor-pointer
          ${capturing
            ? "border-indigo-500 bg-indigo-50 text-indigo-600 animate-pulse"
            : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          }`}
      >
        {capturing ? "Press a key…" : formatKeyBinding(value)}
      </button>
      {capturing && <p className="text-xs text-gray-400">Press any key or combination. Escape to cancel.</p>}
    </div>
  );
}
