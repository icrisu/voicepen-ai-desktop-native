import type { ReactNode } from "react";

type AlertType = "info" | "warning" | "error";

const STYLES: Record<AlertType, string> = {
  info:    "border-blue-300 bg-blue-50 text-blue-800",
  warning: "border-yellow-300 bg-yellow-50 text-yellow-800",
  error:   "border-red-300 bg-red-50 text-red-800",
};

interface Props {
  type?: AlertType;
  children: ReactNode;
}

export default function AlertBanner({ type = "warning", children }: Props) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${STYLES[type]}`}>
      {children}
    </div>
  );
}
