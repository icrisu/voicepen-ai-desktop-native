import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { t } from "../../shared/i18n";

interface CardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  excerpt?: string;
  children: React.ReactNode;
}

export default function Card({ title, icon: Icon, iconColor = "#374151", actions, collapsible = false, defaultExpanded = false, excerpt, children }: CardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div
        className={`flex items-start justify-between ${collapsible ? "cursor-pointer select-none" : ""} mb-4`}
        onClick={collapsible ? () => setExpanded(v => !v) : undefined}
      >
        <div className="flex items-start gap-3">
          <Icon size={20} style={{ color: iconColor }} className="mt-1" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
          {collapsible && (
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>
      {collapsible && !expanded && excerpt && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 italic">{excerpt}</p>
          <button
            onClick={e => { e.stopPropagation(); setExpanded(true); }}
            className="flex items-center gap-1 mx-auto text-sm font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            {t("cardShowMore")}
            <ChevronDown size={13} />
          </button>
        </div>
      )}
      {(!collapsible || expanded) && children}
    </div>
  );
}
