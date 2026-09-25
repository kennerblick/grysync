import type { LanguagePref } from "./locales";

// Profile and application state. The whole AppState is persisted as JSON by
// the Rust side (see src-tauri/src/store.rs).

export type EndpointKind = "local" | "ssh" | "daemon";

export interface Endpoint {
  kind: EndpointKind;
  /** Local path, remote path (ssh) or `module/path` (daemon). */
  path: string;
  user: string;
  host: string;
  /** Daemon port (ssh ports are configured in SshSettings). */
  port: string;
}

export interface SshSettings {
  port: string;
  identity: string;
  /** Additional arguments for ssh, e.g. `-o StrictHostKeyChecking=accept-new`. */
  extra: string;
}

export type FilterAction = "exclude" | "include" | "filter";

export interface FilterRule {
  id: string;
  action: FilterAction;
  pattern: string;
  enabled: boolean;
}

export type OptionValue = boolean | number | string | string[];

export interface Profile {
  id: string;
  name: string;
  source: Endpoint;
  dest: Endpoint;
  ssh: SshSettings;
  options: Record<string, OptionValue>;
  filters: FilterRule[];
  /** Free-form additional arguments, shell-quoted. */
  extraArgs: string;
  /** Adds --info=progress2 so grysync can show an overall progress bar. */
  liveProgress: boolean;
}

export type Theme = "system" | "dark" | "light";

export interface Settings {
  rsyncPath: string;
  theme: Theme;
  language: LanguagePref;
  /** Ask before running a profile that deletes files without a dry run. */
  confirmDangerous: boolean;
}

export interface RunRecord {
  profileName: string;
  command: string;
  startedAt: number;
  durationMs: number;
  code: number | null;
  cancelled: boolean;
  dryRun: boolean;
}

export interface AppState {
  version: 1;
  profiles: Profile[];
  activeId: string;
  settings: Settings;
  history: RunRecord[];
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyEndpoint(): Endpoint {
  return { kind: "local", path: "", user: "", host: "", port: "" };
}

export function newProfile(name = "New sync"): Profile {
  return {
    id: uid(),
    name,
    source: emptyEndpoint(),
    dest: emptyEndpoint(),
    ssh: { port: "", identity: "", extra: "" },
    options: { archive: true, "human-readable": 1, partial: true, stats: true },
    filters: [],
    extraArgs: "",
    liveProgress: true,
  };
}

export function defaultState(firstProfileName = "My first sync"): AppState {
  const p = newProfile(firstProfileName);
  return {
    version: 1,
    profiles: [p],
    activeId: p.id,
    settings: { rsyncPath: "", theme: "system", language: "system", confirmDangerous: true },
    history: [],
  };
}

export interface Preset {
  /** Label and help come from the translation keys `preset.<id>` and `preset.<id>.help`. */
  id: "copy" | "mirror" | "backup" | "snapshot" | "update" | "move";
  options: Record<string, OptionValue>;
}

const base: Record<string, OptionValue> = { archive: true, "human-readable": 1, partial: true, stats: true };

export const presets: Preset[] = [
  { id: "copy", options: { ...base } },
  { id: "mirror", options: { ...base, delete: true } },
  { id: "backup", options: { ...base, delete: true, backup: true } },
  { id: "snapshot", options: { ...base, "hard-links": true, "link-dest": [""] } },
  { id: "update", options: { ...base, existing: true, update: true } },
  { id: "move", options: { ...base, "remove-source-files": true } },
];
