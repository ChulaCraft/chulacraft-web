"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/icons";

export function CopyButton({ text, className = "btn btn-primary" }: { text: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return <>
    <span className="sr-only" role="status" aria-live="polite">
      {state === "copied" ? "Server address copied" : state === "failed" ? "Couldn't copy. Select the address and copy it manually." : ""}
    </span>
    <button type="button" className={className} onClick={copy} style={{ minWidth: 112 }}>
      <PixelIcon name={state === "copied" ? "check" : "copy"} />
      {state === "copied" ? "Copied" : "Copy"}
    </button>
  </>;
}
