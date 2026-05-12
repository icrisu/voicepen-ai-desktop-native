interface Props {
  wClass?: string;
  hClass?: string;
  rootClasses?: string;
  type?: "black" | "light";
}

export default function Logo({ wClass = "w-20", hClass = "h-20", type = "black", rootClasses = "" }: Props) {
  const blobClass = type === "black" ? "blob-dark" : "blob-light";

  return (
    <div className={`flex items-center justify-center relative ${rootClasses}`}>
      <div className={`relative ${wClass} ${hClass}`}>
        <svg viewBox="0 0 1200 1200" className="absolute inset-0 w-full h-full">
          <g className={`${blobClass} blob-1`}>
            <path d="M100 600 q0 -500, 500 -500 t500 500 t-500 500 T100 600 z" />
          </g>
          <g className={`${blobClass} blob-2`}>
            <path d="M100 600 q-50 -400, 500 -500 t450 550 t-500 500 T100 600 z" />
          </g>
          <g className={`${blobClass} blob-3`}>
            <path d="M100 600 q0 -400, 500 -500 t400 500 t-500 500 T100 600 z" />
          </g>
          <g className={`${blobClass} blob-4`}>
            <path d="M150 600 q0 -600, 500 -500 t500 550 t-500 500 T150 600 z" />
          </g>
        </svg>
        <div className={`absolute inset-1/2 ${wClass} ${hClass} -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-white via-pink-400 to-blue-400 opacity-60 blur-3xl animate-pulse`} />
      </div>
    </div>
  );
}
