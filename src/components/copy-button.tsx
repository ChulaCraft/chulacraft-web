"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/icons";
import styles from "./copy-button.module.css";

/** `what` names the copied thing for screen readers ("… copied"). */
export function CopyButton({ text, className = "btn btn-primary", what = "Server address" }: { text: string; className?: string; what?: string }) {
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
      {state === "copied" ? `${what} copied` : state === "failed" ? `Couldn't copy. Select the ${what.toLowerCase()} and copy it manually.` : ""}
    </span>
    <button type="button" className={`${className} ${styles.copyButton}`} onClick={copy}>
      <PixelIcon name={state === "copied" ? "check" : "copy"} />
      {state === "copied" ? "Copied" : "Copy"}
    </button>
  </>;
}
