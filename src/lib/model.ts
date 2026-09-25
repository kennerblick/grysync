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

export function defaultState(): AppState {
  const p = newProfile("My first sync");
  return {
    version: 1,
    profiles: [p],
    activeId: p.id,
    settings: { rsyncPath: "", theme: "system", confirmDangerous: true },
    history: [],
  };
}

export interface Preset {
  id: string;
  label: string;
  help: string;
  options: Record<string, OptionValue>;
}

const base: Record<string, OptionValue> = { archive: true, "human-readable": 1, partial: true, stats: true };

export const presets: Preset[] = [
  { id: "copy", label: "Copy", help: "Copy new and changed files, never delete.", options: { ...base } },
  { id: "mirror", label: "Mirror", help: "Make the destination an exact copy, deleting extra files.", options: { ...base, delete: true } },
  { id: "backup", label: "Safe mirror", help: "Mirror, but keep replaced and deleted files with a ~ suffix.", options: { ...base, delete: true, backup: true } },
  { id: "snapshot", label: "Snapshot", help: "Incremental snapshot: unchanged files are hard-linked to the previous snapshot (set Hard-link to directory).", options: { ...base, "hard-links": true, "link-dest": [""] } },
  { id: "update", label: "Update only", help: "Only refresh files that already exist, skip newer files on the destination.", options: { ...base, existing: true, update: true } },
  { id: "move", label: "Move", help: "Transfer files and remove them from the source afterwards.", options: { ...base, "remove-source-files": true } },
];
