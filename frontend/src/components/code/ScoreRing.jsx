import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function colorForScore(score) {
  if (score < 40) return { stroke: "stroke-red-500", text: "text-red-300" };
  if (score <= 70) return { stroke: "stroke-amber-400", text: "text-amber-200" };
  return { stroke: "stroke-emerald-400", text: "text-emerald-200" };
}

export default function ScoreRing({ score = 0, size = 140, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offsetTarget = circumference - (clamped / 100) * circumference;
  const { stroke, text } = useMemo(() => colorForScore(clamped), [clamped]);

  const [offset, setOffset] = useState(circumference);
  useEffect(() => {
    const t = setTimeout(() => setOffset(offsetTarget), 60);
    return () => clearTimeout(t);
  }, [offsetTarget]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-zinc-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={cn(stroke, "transition-[stroke-dashoffset] duration-1000 ease-out")}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className={cn("font-mono text-3xl font-semibold", text)}>{clamped}</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-zinc-400">Score</div>
    </div>
  );
}

