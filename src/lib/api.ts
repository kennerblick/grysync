// Thin wrapper around the Tauri commands. When the UI runs in a plain browser
// (`npm run dev` without Tauri) a small mock is used so the interface can be
// developed and tested without the desktop shell.

import { Channel, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppState } from "./model";

export interface RsyncInfo {
  program: string;
  version: string;
  protocol: number | null;
  flavor: string;
  raw: string;
}

export interface Progress {
  bytes: number;
  percent: number;
  rate: string;
  eta: string;
  transferred: number | null;
  toCheck: number | null;
  total: number | null;
  incremental: boolean;
}

export type RunEvent =
  | { event: "started"; data: { runId: number; pid: number } }
  | { event: "line"; data: { stream: "out" | "err"; text: string } }
  | { event: "progress"; data: Progress }
  | { event: "finished"; data: { code: number | null; success: boolean; cancelled: boolean; durationMs: number } };

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const STORAGE_KEY = "grysync-state";

export async function rsyncInfo(program: string): Promise<RsyncInfo> {
  if (!isTauri) {
    return { program: program || "rsync", version: "3.4.1", protocol: 32, flavor: "rsync", raw: "rsync  version 3.4.1  protocol version 32 (browser preview)" };
  }
  return invoke("rsync_info", { program: program || null });
}

export async function loadState(): Promise<AppState | null> {
  if (!isTauri) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return invoke("load_state");
}

export async function saveState(state: AppState): Promise<void> {
  if (!isTauri) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: nothing to do */
    }
    return;
  }
  await invoke("save_state", { state });
}

export async function configPath(): Promise<string> {
  return isTauri ? invoke("config_path") : "browser localStorage";
}

export async function pickPath(directory: boolean, title: string): Promise<string | null> {
  if (!isTauri) return window.prompt(title) || null;
  const result = await open({ directory, multiple: false, title });
  return typeof result === "string" ? result : null;
}

export async function startSync(program: string, args: string[], onEvent: (e: RunEvent) => void): Promise<number> {
  if (!isTauri) return mockRun(args, onEvent);
  const channel = new Channel<RunEvent>();
  channel.onmessage = onEvent;
  return invoke("start_sync", { program: program || null, args, onEvent: channel });
}

export async function cancelSync(runId: number): Promise<void> {
  if (!isTauri) {
    mockCancel = true;
    return;
  }
  await invoke("cancel_sync", { runId });
}

let mockCancel = false;

function mockRun(args: string[], onEvent: (e: RunEvent) => void): number {
  mockCancel = false;
  const started = Date.now();
  onEvent({ event: "started", data: { runId: 1, pid: 4242 } });
  onEvent({ event: "line", data: { stream: "out", text: "sending incremental file list" } });
  let step = 0;
  const total = 40;
  const timer = setInterval(() => {
    step++;
    if (mockCancel || step > total) {
      clearInterval(timer);
      if (!mockCancel) {
        onEvent({ event: "line", data: { stream: "out", text: "" } });
        onEvent({ event: "line", data: { stream: "out", text: `sent 12.34M bytes  received 1.02K bytes  4.11M bytes/sec` } });
        onEvent({ event: "line", data: { stream: "out", text: `total size is 12.30M  speedup is 1.00${args.includes("--dry-run") ? " (DRY RUN)" : ""}` } });
      } else {
        onEvent({ event: "line", data: { stream: "err", text: "rsync error: received SIGINT, SIGTERM, or SIGHUP (code 20)" } });
      }
      onEvent({
        event: "finished",
        data: { code: mockCancel ? 20 : 0, success: !mockCancel, cancelled: mockCancel, durationMs: Date.now() - started },
      });
      return;
    }
    if (step % 3 === 0) {
      onEvent({ event: "line", data: { stream: "out", text: `>f+++++++++ photos/2026/IMG_${1000 + step}.jpg` } });
    }
    onEvent({
      event: "progress",
      data: {
        bytes: Math.round((12_340_000 * step) / total),
        percent: Math.round((100 * step) / total),
        rate: `${(3 + Math.random()).toFixed(2)}MB/s`,
        eta: `0:00:${String(total - step).padStart(2, "0")}`,
        transferred: Math.floor(step / 3),
        toCheck: total - step,
        total,
        incremental: false,
      },
    });
  }, 120);
  return 1;
}
