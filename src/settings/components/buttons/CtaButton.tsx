import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export enum CtaButtonSize {
  Sm = "sm",
  Md = "md",
  Lg = "lg",
}

interface CtaButtonProps {
  children: React.ReactNode;
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  toLink?: string;
  className?: string;
  size?: CtaButtonSize;
}

const base =
  "bg-white rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow font-medium text-gray-800 cursor-pointer";

const sizeMap: Record<CtaButtonSize, { padding: string; icon: string; iconSize: number; text: string }> = {
  [CtaButtonSize.Sm]: { padding: "px-3 py-1.5",  icon: "w-6 h-6", iconSize: 13, text: "text-xs" },
  [CtaButtonSize.Md]: { padding: "px-3.5 py-2",  icon: "w-7 h-7", iconSize: 15, text: "text-sm" },
  [CtaButtonSize.Lg]: { padding: "px-4 py-3",    icon: "w-8 h-8", iconSize: 18, text: "text-sm" },
};

export default function CtaButton({
  children,
  icon: Icon,
  iconColor = "#374151",
  onClick,
  toLink,
  className = "",
  size = CtaButtonSize.Lg,
}: CtaButtonProps) {
  const { padding, icon, iconSize, text } = sizeMap[size];
  const content = (
    <>
      <span
        className={`flex items-center justify-center rounded-full mr-1 ${icon}`}
        style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 10%, transparent)` }}
      >
        <Icon size={iconSize} style={{ color: iconColor }} />
      </span>
      <span className={text}>{children}</span>
    </>
  );

  const sizeClasses = padding;

  if (toLink) {
    return (
      <Link to={toLink} className={`${base} ${sizeClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${sizeClasses} ${className}`}>
      {content}
    </button>
  );
}
