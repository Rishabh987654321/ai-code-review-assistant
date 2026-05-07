import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export default function OtpInput({ value, onChange, length = 6, disabled }) {
  const refs = useRef([]);

  const digits = useMemo(() => {
    const v = (value || "").replace(/\D/g, "").slice(0, length);
    return Array.from({ length }, (_, i) => v[i] || "");
  }, [value, length]);

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const setAt = (idx, next) => {
    const arr = [...digits];
    arr[idx] = next;
    onChange(arr.join(""));
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          onChange={(e) => {
            const next = (e.target.value || "").replace(/\D/g, "");
            const char = next.slice(-1);
            setAt(idx, char);
            if (char && refs.current[idx + 1]) refs.current[idx + 1].focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              if (digits[idx]) {
                setAt(idx, "");
              } else if (refs.current[idx - 1]) {
                refs.current[idx - 1].focus();
              }
            }
            if (e.key === "ArrowLeft" && refs.current[idx - 1]) refs.current[idx - 1].focus();
            if (e.key === "ArrowRight" && refs.current[idx + 1]) refs.current[idx + 1].focus();
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!pasted) return;
            onChange(pasted);
            const nextIndex = Math.min(pasted.length, length - 1);
            refs.current[nextIndex]?.focus();
            e.preventDefault();
          }}
          className={cn(
            "h-12 w-10 rounded-lg border border-zinc-800 bg-zinc-950 text-center font-mono text-lg text-zinc-100",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/60",
            disabled && "opacity-60"
          )}
        />
      ))}
    </div>
  );
}

