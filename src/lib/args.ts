// Turns a Profile into the argument vector handed to rsync, plus a
// copy-pasteable shell command and a list of warnings.

import type { Endpoint, Profile } from "./model";
import { compareVersions, optionById, options } from "./options";

/** Formats an endpoint the way rsync expects it on the command line. */
export function endpointToArg(e: Endpoint): string {
  if (e.kind === "local") return e.path;
  const user = e.user.trim() ? `${e.user.trim()}@` : "";
  let host = e.host.trim();
  if (e.kind === "ssh") {
    if (host.includes(":") && !host.startsWith("[")) host = `[${host}]`;
    return `${user}${host}:${e.path}`;
  }
  const port = e.port.trim() ? `:${e.port.trim()}` : "";
  return `rsync://${user}${host}${port}/${e.path.replace(/^\/+/, "")}`;
}

/** Quotes a word for rsync's own -e splitting (whitespace + quotes). */
function quoteForRsh(word: string): string {
  return /[\s"']/.test(word) ? `"${word.replace(/(["\\])/g, "\\$1")}"` : word;
}

/** The remote-shell command derived from the SSH settings, if any. */
export function sshCommand(p: Profile): string | null {
  const usesSsh = p.source.kind === "ssh" || p.dest.kind === "ssh";
  const { port, identity, extra } = p.ssh;
  if (!usesSsh || (!port.trim() && !identity.trim() && !extra.trim())) return null;
  const parts = ["ssh"];
  if (port.trim()) parts.push("-p", port.trim());
  if (identity.trim()) parts.push("-i", quoteForRsh(identity.trim()));
  if (extra.trim()) parts.push(extra.trim());
  return parts.join(" ");
}

/** Splits a string into words like a POSIX shell (quotes and backslashes). */
export function splitArgs(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inWord = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      else cur += c;
    } else if (quote === '"') {
      if (c === '"') quote = null;
      else if (c === "\\" && i + 1 < input.length && '"\\$`'.includes(input[i + 1])) cur += input[++i];
      else cur += c;
    } else if (c === "'" || c === '"') {
      quote = c;
      inWord = true;
    } else if (c === "\\" && i + 1 < input.length) {
      cur += input[++i];
      inWord = true;
    } else if (/\s/.test(c)) {
      if (inWord) out.push(cur);
      cur = "";
      inWord = false;
    } else {
      cur += c;
      inWord = true;
    }
  }
  if (inWord) out.push(cur);
  return out;
}

/** Quotes a word for display in a POSIX shell. */
export function shellQuote(word: string): string {
  if (word !== "" && /^[A-Za-z0-9_\-+=.,/:@%^]+$/.test(word)) return word;
  return `'${word.replace(/'/g, `'\\''`)}'`;
}

export function buildArgs(p: Profile): string[] {
  const args: string[] = [];

  for (const o of options) {
    const v = p.options[o.id];
    if (v === undefined || v === false || v === "" || v === 0) continue;
    const name = o.shortOnly ? `-${o.short}` : `--${o.id}`;
    switch (o.kind) {
      case "flag":
        if (v === true) args.push(name);
        break;
      case "count":
        for (let i = 0; i < Math.min(Number(v) || 0, 5); i++) args.push(name);
        break;
      case "list":
        for (const item of Array.isArray(v) ? v : [String(v)]) {
          if (item.trim()) args.push(`${name}=${item}`);
        }
        break;
      default: {
        const s = String(v);
        if (s.trim()) args.push(`${name}=${s}`);
      }
    }
  }

  if (!p.options.rsh) {
    const ssh = sshCommand(p);
    if (ssh) args.push(`--rsh=${ssh}`);
  }

  for (const r of p.filters) {
    if (!r.enabled || !r.pattern.trim()) continue;
    args.push(`--${r.action}=${r.pattern}`);
  }

  if (p.liveProgress && !p.options.quiet) args.push("--info=progress2");

  args.push(...splitArgs(p.extraArgs));

  if (p.source.path || p.source.host) args.push(endpointToArg(p.source));
  if (p.dest.path || p.dest.host) args.push(endpointToArg(p.dest));
  return args;
}

export function commandLine(program: string, args: string[]): string {
  return [program || "rsync", ...args].map(shellQuote).join(" ");
}

export type Level = "error" | "warn" | "info";
export interface Issue {
  level: Level;
  text: string;
}

const conflicts: [string, string, string][] = [
  ["checksum", "size-only", "Compare by checksum and Compare size only exclude each other."],
  ["links", "copy-links", "Follow symlinks overrides Copy symlinks as symlinks."],
  ["inplace", "delay-updates", "In-place updates cannot be combined with Delay updates."],
  ["inplace", "partial-dir", "In-place updates ignore the partial-file directory."],
  ["quiet", "verbose", "Quiet and Verbose cancel each other out."],
  ["existing", "ignore-existing", "Only update existing + Skip existing files transfers nothing."],
  ["append", "append-verify", "Choose either Append or Append and verify."],
  ["ipv4", "ipv6", "Choose either IPv4 or IPv6."],
  ["whole-file", "inplace", "Whole-file copies make in-place updates pointless."],
];

const deleteOptions = [
  "delete", "delete-before", "delete-during", "delete-delay", "delete-after",
  "delete-excluded", "remove-source-files", "delete-missing-args",
];

function isSet(p: Profile, id: string): boolean {
  const v = p.options[id];
  if (Array.isArray(v)) return v.some((s) => s.trim() !== "");
  return v !== undefined && v !== false && v !== "" && v !== 0;
}

export function deletesFiles(p: Profile): boolean {
  return deleteOptions.some((id) => isSet(p, id));
}

export function validate(p: Profile, rsyncVersion?: string): Issue[] {
  const issues: Issue[] = [];
  const hasEndpoint = (e: Endpoint) => (e.kind === "local" ? !!e.path.trim() : !!e.host.trim());

  if (!hasEndpoint(p.source)) issues.push({ level: "error", text: "Choose a source." });
  if (!hasEndpoint(p.dest) && !isSet(p, "list-only")) issues.push({ level: "error", text: "Choose a destination." });
  if (p.source.kind !== "local" && p.dest.kind !== "local") {
    issues.push({ level: "error", text: "rsync cannot copy between two remote hosts; one side must be local." });
  }

  for (const [a, b, text] of conflicts) {
    if (isSet(p, a) && isSet(p, b)) issues.push({ level: "warn", text });
  }

  if (deletesFiles(p) && !isSet(p, "dry-run")) {
    issues.push({ level: "warn", text: "This profile deletes files. Run a dry run first to see what would be removed." });
  }
  if (isSet(p, "delete") && p.source.kind === "local" && p.source.path && !/[\\/]$/.test(p.source.path)) {
    issues.push({
      level: "info",
      text: "The source has no trailing slash, so the folder itself is copied into the destination. Add / to mirror its contents.",
    });
  }
  if (isSet(p, "link-dest") && !isSet(p, "archive") && !isSet(p, "times")) {
    issues.push({ level: "warn", text: "Hard-link snapshots need preserved times (-t or -a) to detect unchanged files." });
  }

  if (rsyncVersion) {
    for (const o of options) {
      if (o.since && isSet(p, o.id) && compareVersions(rsyncVersion, o.since) < 0) {
        issues.push({ level: "error", text: `--${o.id} needs rsync ${o.since} or newer (installed: ${rsyncVersion}).` });
      }
    }
    if (p.liveProgress && compareVersions(rsyncVersion, "3.1.0") < 0) {
      issues.push({ level: "warn", text: "Live progress needs rsync 3.1.0+; disable it in the command bar." });
    }
  }

  for (const id of Object.keys(p.options)) {
    if (!optionById.has(id)) issues.push({ level: "info", text: `Unknown option "${id}" is ignored.` });
  }
  return issues;
}

/** Human-readable meaning of rsync's exit codes. */
export function exitMessage(code: number | null): string {
  const messages: Record<number, string> = {
    0: "Success",
    1: "Syntax or usage error",
    2: "Protocol incompatibility",
    3: "Errors selecting input/output files or directories",
    4: "Requested action not supported",
    5: "Error starting client-server protocol",
    6: "Daemon unable to append to log file",
    10: "Error in socket I/O",
    11: "Error in file I/O",
    12: "Error in rsync protocol data stream",
    13: "Errors with program diagnostics",
    14: "Error in IPC code",
    20: "Received SIGUSR1 or SIGINT",
    21: "Some error returned by waitpid()",
    22: "Error allocating core memory buffers",
    23: "Partial transfer due to error",
    24: "Partial transfer due to vanished source files",
    25: "The --max-delete limit stopped deletions",
    30: "Timeout in data send/receive",
    35: "Timeout waiting for daemon connection",
    255: "Remote shell failed (check host, credentials and SSH keys)",
  };
  if (code === null) return "Terminated by a signal";
  return messages[code] ?? `Exit code ${code}`;
}
