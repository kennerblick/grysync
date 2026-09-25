// Turns a Profile into the argument vector handed to rsync, plus a
// copy-pasteable shell command and a list of warnings.

import type { MessageKey, Params } from "./locales";
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
  /** Translation key; render with `t(issue.key, issue.params)`. */
  key: MessageKey;
  params?: Params;
}

const conflicts: [string, string, MessageKey][] = [
  ["checksum", "size-only", "conflict.checksumSizeOnly"],
  ["links", "copy-links", "conflict.linksCopyLinks"],
  ["inplace", "delay-updates", "conflict.inplaceDelay"],
  ["inplace", "partial-dir", "conflict.inplacePartialDir"],
  ["quiet", "verbose", "conflict.quietVerbose"],
  ["existing", "ignore-existing", "conflict.existingIgnoreExisting"],
  ["append", "append-verify", "conflict.appendVerify"],
  ["ipv4", "ipv6", "conflict.ipv4ipv6"],
  ["whole-file", "inplace", "conflict.wholeFileInplace"],
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

  if (!hasEndpoint(p.source)) issues.push({ level: "error", key: "issue.noSource" });
  if (!hasEndpoint(p.dest) && !isSet(p, "list-only")) issues.push({ level: "error", key: "issue.noDest" });
  if (p.source.kind !== "local" && p.dest.kind !== "local") {
    issues.push({ level: "error", key: "issue.remoteToRemote" });
  }

  for (const [a, b, key] of conflicts) {
    if (isSet(p, a) && isSet(p, b)) issues.push({ level: "warn", key });
  }

  if (deletesFiles(p) && !isSet(p, "dry-run")) {
    issues.push({ level: "warn", key: "issue.deletesWithoutDryRun" });
  }
  if (isSet(p, "delete") && p.source.kind === "local" && p.source.path && !/[\\/]$/.test(p.source.path)) {
    issues.push({ level: "info", key: "issue.noTrailingSlash" });
  }
  if (isSet(p, "link-dest") && !isSet(p, "archive") && !isSet(p, "times")) {
    issues.push({ level: "warn", key: "issue.linkDestTimes" });
  }

  if (rsyncVersion) {
    for (const o of options) {
      if (o.since && isSet(p, o.id) && compareVersions(rsyncVersion, o.since) < 0) {
        issues.push({
          level: "error",
          key: "issue.tooOld",
          params: { option: o.id, since: o.since, version: rsyncVersion },
        });
      }
    }
    if (p.liveProgress && compareVersions(rsyncVersion, "3.1.0") < 0) {
      issues.push({ level: "warn", key: "issue.progressTooOld" });
    }
  }

  for (const id of Object.keys(p.options)) {
    if (!optionById.has(id)) issues.push({ level: "info", key: "issue.unknownOption", params: { option: id } });
  }
  return issues;
}
