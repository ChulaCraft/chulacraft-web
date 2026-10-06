"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/icons";
import styles from "../admin.module.css";
import { openConsole } from "./actions";

const KEEP = 500;

/** Live server log over the manager's WebSocket, plus a command box for those allowed to type. */
export function ServerConsole({ server, initial, canWrite }: { server: string; initial: string[]; canWrite: boolean }) {
  const [lines, setLines] = useState(initial);
  const [status, setStatus] = useState<"connecting" | "live" | "closed" | "denied">("connecting");
  const [attempt, setAttempt] = useState(0);
  const socket = useRef<WebSocket | null>(null);
  const log = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let stopped = false;
    const add = (line: string) => setLines((all) => [...all.slice(1 - KEEP), line]);
    openConsole(server, canWrite).then((access) => {
      if (stopped) return;
      if (!access) return setStatus("denied");
      try {
        ws = new WebSocket(access.url, access.protocols);
      } catch {
        // A blocked or malformed URL throws here instead of firing onclose;
        // show "closed" so Reconnect appears rather than "connecting" forever.
        return setStatus("closed");
      }
      socket.current = ws;
      ws.onopen = () => setStatus("live");
      ws.onclose = () => setStatus("closed");
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data));
          if (message.type === "log") add(String(message.message));
          else if (message.type === "error") add(`! ${message.message}`);
        } catch {
          // Not ours; ignore.
        }
      };
    }, () => !stopped && setStatus("closed"));
    return () => {
      stopped = true;
      ws?.close();
    };
  }, [server, canWrite, attempt]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("command") as HTMLInputElement;
    const command = input.value.trim();
    if (!command || socket.current?.readyState !== WebSocket.OPEN) return;
    socket.current.send(JSON.stringify({ type: "command", command }));
    setLines((all) => [...all.slice(1 - KEEP), `> ${command}`]);
    input.value = "";
  }

  return (
    <section aria-label="Console">
      <div className={styles.sectionTitle}>
        Console
        <span className={`badge badge-${status === "live" ? "green" : "muted"}`} role="status">{status}</span>
        {(status === "closed" || status === "denied") && (
          <button type="button" className="btn btn-sm" onClick={() => { setStatus("connecting"); setAttempt((n) => n + 1); }}>Reconnect</button>
        )}
      </div>
      <pre ref={log} className={styles.console} tabIndex={0} aria-label="Server log">{lines.join("\n")}</pre>
      {canWrite && (
        <form onSubmit={send} className={styles.consoleInput}>
          <label htmlFor="console-command" className="sr-only">Command</label>
          <input id="console-command" name="command" className="input mono" placeholder="say Hello" autoComplete="off" spellCheck="false" disabled={status !== "live"} />
          <button type="submit" className="btn btn-sm" disabled={status !== "live"}><PixelIcon name="arrow" />Send</button>
        </form>
      )}
    </section>
  );
}
