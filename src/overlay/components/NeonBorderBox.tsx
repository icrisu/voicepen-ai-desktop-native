import type { ReactNode } from "react";

interface NeonBorderBoxProps {
  children?: ReactNode;
}

export function NeonBorderBox({ children }: NeonBorderBoxProps) {
  return (
    <div className="relative rounded-xl p-[2px] overflow-hidden">
      <div className="absolute inset-0 w-full h-full left-0 top-0 rounded-xl bg-fuchsia-800"></div>
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 animate-neon">
          <div className="w-full h-full rounded-xl bg-[conic-gradient(from_0deg,_#00f,_#0ff,_#f0f,_#00f)] blur-md opacity-80"></div>
        </div>
      </div>
      <div className="relative bg-[#0A0A0A]/90 backdrop-blur-xl rounded-xl text-white flex flex-col max-h-[540px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
