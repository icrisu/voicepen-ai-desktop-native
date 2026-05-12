import type { KeyBinding } from "../types";

type KeyEventLike = Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">;

export function keyBindingMatches(binding: KeyBinding, e: KeyEventLike): boolean {
  return (
    e.key === binding.key &&
    !!e.ctrlKey === !!binding.ctrlKey &&
    !!e.altKey === !!binding.altKey &&
    !!e.shiftKey === !!binding.shiftKey &&
    !!e.metaKey === !!binding.metaKey
  );
}

export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrlKey) parts.push("Ctrl");
  if (binding.altKey) parts.push("Alt");
  if (binding.shiftKey) parts.push("Shift");
  if (binding.metaKey) parts.push("Meta");
  const keyLabel =
    binding.key === " " ? "Space"
    : binding.key === "ArrowUp" ? "↑"
    : binding.key === "ArrowDown" ? "↓"
    : binding.key === "ArrowLeft" ? "←"
    : binding.key === "ArrowRight" ? "→"
    : binding.key.length === 1 ? binding.key.toUpperCase()
    : binding.key;
  parts.push(keyLabel);
  return parts.join("+");
}
