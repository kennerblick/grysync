import * as api from "./api";
import type { Progress, RsyncInfo } from "./api";
import { buildArgs, commandLine } from "./args";
import { i18n, t } from "./i18n.svelte";
import { defaultState, newProfile, type AppState, type Profile } from "./model";

export type RunStatus = "idle" | "running" | "success" | "failed" | "cancelled";

export interface LogLine {
  stream: "out" | "err" | "sys";
  text: string;
}

const MAX_LOG_LINES = 5000;
const MAX_HISTORY = 100;

class Store {
  state = $state<AppState>(defaultState(t("profile.first")));
  loaded = $state(false);
  saveError = $state<string | null>(null);

  info = $state<RsyncInfo | null>(null);
  infoError = $state<string | null>(null);

  status = $state<RunStatus>("idle");
  runId = $state<number | null>(null);
  dryRun = $state(false);
  progress = $state<Progress | null>(null);
  lines = $state.raw<LogLine[]>([]);
  exitCode = $state<number | null>(null);
  durationMs = $state(0);
  runCommand = $state("");

  #pending: LogLine[] = [];
  #flushTimer: ReturnType<typeof setTimeout> | null = null;
  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  get profile(): Profile {
    return this.state.profiles.find((p) => p.id === this.state.activeId) ?? this.state.profiles[0];
  }

  get program(): string {
    return this.state.settings.rsyncPath.trim() || "rsync";
  }

  async init() {
    try {
      const saved = await api.loadState();
      if (saved && Array.isArray(saved.profiles) && saved.profiles.length) {
        const defaults = defaultState(t("profile.first"));
        this.state = {
          ...defaults,
          ...saved,
          settings: { ...defaults.settings, ...saved.settings },
          history: saved.history ?? [],
          profiles: saved.profiles.map((p) => ({ ...newProfile(), ...p })),
        };
      }
    } catch (e) {
      this.saveError = t("store.loadError", { e: String(e) });
    }
    this.loaded = true;

    $effect.root(() => {
      $effect(() => {
        const snapshot = $state.snapshot(this.state);
        if (this.#saveTimer) clearTimeout(this.#saveTimer);
        this.#saveTimer = setTimeout(() => {
          api.saveState(snapshot).then(
            () => (this.saveError = null),
            (e) => (this.saveError = t("store.saveError", { e: String(e) })),
          );
        }, 400);
      });
      $effect(() => {
        document.documentElement.dataset.theme = this.state.settings.theme;
      });
      $effect(() => {
        i18n.setPreference(this.state.settings.language);
        document.documentElement.lang = i18n.locale;
      });
    });

    await this.detect();
  }

  async detect() {
    this.info = null;
    this.infoError = null;
    try {
      this.info = await api.rsyncInfo(this.state.settings.rsyncPath.trim());
    } catch (e) {
      this.infoError = String(e);
    }
  }

  addProfile(from?: Profile) {
    const p: Profile = from
      ? { ...structuredClone($state.snapshot(from)), id: newProfile().id, name: t("profile.copyOf", { name: from.name }) }
      : newProfile(t("profile.new"));
    this.state.profiles.push(p);
    this.state.activeId = p.id;
  }

  deleteProfile(id: string) {
    if (this.state.profiles.length <= 1) return;
    const i = this.state.profiles.findIndex((p) => p.id === id);
    this.state.profiles.splice(i, 1);
    if (this.state.activeId === id) this.state.activeId = this.state.profiles[Math.max(0, i - 1)].id;
  }

  async start(dryRun: boolean) {
    if (this.status === "running") return;
    const profile = $state.snapshot(this.profile) as Profile;
    if (dryRun) profile.options["dry-run"] = true;
    const args = buildArgs(profile);

    this.dryRun = dryRun || profile.options["dry-run"] === true;
    this.status = "running";
    this.progress = null;
    this.exitCode = null;
    this.durationMs = 0;
    this.lines = [];
    this.#pending = [];
    this.runCommand = commandLine(this.program, args);
    this.#log({ stream: "sys", text: `$ ${this.runCommand}` });
    const startedAt = Date.now();

    try {
      this.runId = await api.startSync(this.state.settings.rsyncPath.trim(), args, (e) => {
        switch (e.event) {
          case "line":
            this.#log(e.data);
            break;
          case "progress":
            this.progress = e.data;
            break;
          case "finished": {
            this.#flush();
            this.exitCode = e.data.code;
            this.durationMs = e.data.durationMs;
            this.status = e.data.cancelled ? "cancelled" : e.data.success ? "success" : "failed";
            this.runId = null;
            this.state.history.unshift({
              profileName: profile.name,
              command: this.runCommand,
              startedAt,
              durationMs: e.data.durationMs,
              code: e.data.code,
              cancelled: e.data.cancelled,
              dryRun: this.dryRun,
            });
            this.state.history.splice(MAX_HISTORY);
            break;
          }
        }
      });
    } catch (e) {
      this.#log({ stream: "err", text: String(e) });
      this.#flush();
      this.status = "failed";
    }
  }

  async cancel() {
    if (this.runId === null) return;
    try {
      await api.cancelSync(this.runId);
      this.#log({ stream: "sys", text: t("run.stopping") });
    } catch (e) {
      this.#log({ stream: "err", text: String(e) });
    }
  }

  // Output can arrive thousands of lines per second; batch it for rendering.
  #log(line: LogLine) {
    this.#pending.push(line);
    if (!this.#flushTimer) this.#flushTimer = setTimeout(() => this.#flush(), 80);
  }

  #flush() {
    if (this.#flushTimer) clearTimeout(this.#flushTimer);
    this.#flushTimer = null;
    if (!this.#pending.length) return;
    const next = this.lines.concat(this.#pending);
    this.#pending = [];
    this.lines = next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
  }
}

export const store = new Store();
