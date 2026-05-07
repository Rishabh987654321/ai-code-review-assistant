import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly,
  className,
  minHeight = 420,
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950",
        className
      )}
      style={{ minHeight }}
    >
      <Editor
        height={minHeight}
        theme="vs-dark"
        language={language || "plaintext"}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        options={{
          readOnly: Boolean(readOnly),
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 14, bottom: 14 },
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
        }}
      />
    </div>
  );
}

