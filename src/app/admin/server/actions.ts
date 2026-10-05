"use server";

import { redirect } from "next/navigation";
import { PERMISSION, managerUrl } from "@/lib/mcsv-token";
import { SERVER_ID, grant, managerFetch } from "./manager";

const ACTIONS = { start: PERMISSION.START, stop: PERMISSION.STOP, restart: PERMISSION.RESTART } as const;

export async function serverAction(formData: FormData) {
  const server = String(formData.get("server") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!SERVER_ID.test(server) || !Object.hasOwn(ACTIONS, action)) redirect("/admin/server");
  const back = `/admin/server?server=${encodeURIComponent(server)}`;

  const token = await grant(action as keyof typeof ACTIONS, ACTIONS[action as keyof typeof ACTIONS], server);
  if (!token) redirect(`${back}&error=FORBIDDEN`);
  try {
    await managerFetch(`/server/${server}/${action}`, token, { method: "POST" });
  } catch {
    redirect(`${back}&error=MANAGER`);
  }
  redirect(`${back}&done=${action}`);
}

/** Where and how the browser opens the console socket. The token rides as a
 *  subprotocol because browsers can't set headers on a WebSocket. */
export async function openConsole(server: string, write: boolean) {
  if (!SERVER_ID.test(server)) return null;
  const need = PERMISSION.CONSOLE_READ | (write ? PERMISSION.CONSOLE_WRITE : 0);
  const token = await grant(write ? "console_write" : "console", need, server);
  if (!token) return null;
  return { url: `${managerUrl().replace(/^http/, "ws")}/server/${server}/console`, protocols: ["mcsv.jwt", token] };
}
