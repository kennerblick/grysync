import { describe, expect, it } from "vitest";
import { buildArgs, commandLine, endpointToArg, shellQuote, splitArgs, validate } from "./args";
import { newProfile, type Profile } from "./model";
import { options } from "./options";

function profile(patch: Partial<Profile> = {}): Profile {
  const p = newProfile();
  p.options = {};
  p.liveProgress = false;
  p.source.path = "/src/";
  p.dest.path = "/dst";
  return { ...p, ...patch };
}

describe("buildArgs", () => {
  it("emits flags, counts, values and lists in catalogue order", () => {
    const args = buildArgs(
      profile({ options: { verbose: 2, archive: true, bwlimit: "5M", "link-dest": ["/a", " ", "/b"] } }),
    );
    expect(args).toEqual(["--archive", "--verbose", "--verbose", "--link-dest=/a", "--link-dest=/b", "--bwlimit=5M", "/src/", "/dst"]);
  });

  it("skips unset and false values", () => {
    expect(buildArgs(profile({ options: { archive: false, suffix: "", verbose: 0 } }))).toEqual(["/src/", "/dst"]);
  });

  it("uses the short form for options without a long name", () => {
    expect(buildArgs(profile({ options: { "filter-merge-dir": 2 } }))).toEqual(["-F", "-F", "/src/", "/dst"]);
  });

  it("appends filters in order, progress, extra args and endpoints", () => {
    const args = buildArgs(
      profile({
        liveProgress: true,
        filters: [
          { id: "1", action: "include", pattern: "*.txt", enabled: true },
          { id: "2", action: "exclude", pattern: "*", enabled: true },
          { id: "3", action: "exclude", pattern: "off", enabled: false },
        ],
        extraArgs: `--out-format='%n %l' -x`,
      }),
    );
    expect(args).toEqual(["--include=*.txt", "--exclude=*", "--info=progress2", "--out-format=%n %l", "-x", "/src/", "/dst"]);
  });

  it("builds an ssh command from the SSH settings unless --rsh is set", () => {
    const p = profile({ ssh: { port: "2222", identity: "/home/me/my key", extra: "" } });
    p.dest = { kind: "ssh", user: "me", host: "nas", path: "/backup", port: "" };
    expect(buildArgs(p)).toContain(`--rsh=ssh -p 2222 -i "/home/me/my key"`);
    p.options.rsh = "ssh -p 1";
    expect(buildArgs(p).filter((a) => a.startsWith("--rsh"))).toEqual(["--rsh=ssh -p 1"]);
  });

  it("knows every catalogue kind", () => {
    const all: Profile["options"] = {};
    for (const o of options) all[o.id] = o.kind === "flag" ? true : o.kind === "count" ? 1 : o.kind === "list" ? ["x"] : "x";
    expect(buildArgs(profile({ options: all })).length).toBeGreaterThanOrEqual(options.length);
  });
});

describe("endpoints", () => {
  it("formats ssh and daemon endpoints", () => {
    expect(endpointToArg({ kind: "ssh", user: "u", host: "h", path: "/p", port: "" })).toBe("u@h:/p");
    expect(endpointToArg({ kind: "ssh", user: "", host: "fe80::1", path: "p", port: "" })).toBe("[fe80::1]:p");
    expect(endpointToArg({ kind: "daemon", user: "", host: "h", path: "/mod/dir", port: "8873" })).toBe("rsync://h:8873/mod/dir");
  });
});

describe("shell helpers", () => {
  it("quotes for display", () => {
    expect(shellQuote("--archive")).toBe("--archive");
    expect(shellQuote("my file")).toBe("'my file'");
    expect(shellQuote("it's")).toBe(`'it'\\''s'`);
    expect(shellQuote("")).toBe("''");
    expect(commandLine("", ["-a", "a b"])).toBe("rsync -a 'a b'");
  });

  it("splits like a shell", () => {
    expect(splitArgs(`a "b c" 'd e' f\\ g "h\\"i" ''`)).toEqual(["a", "b c", "d e", "f g", 'h"i', ""]);
    expect(splitArgs("   ")).toEqual([]);
  });
});

describe("validate", () => {
  it("requires source and destination", () => {
    const p = profile();
    p.source.path = "";
    p.dest.path = "";
    expect(validate(p).filter((i) => i.level === "error")).toHaveLength(2);
  });

  it("warns about deletion without dry run and conflicting options", () => {
    const keys = validate(profile({ options: { delete: true, checksum: true, "size-only": true } })).map((i) => i.key);
    expect(keys).toContain("issue.deletesWithoutDryRun");
    expect(keys).toContain("conflict.checksumSizeOnly");
  });

  it("flags options the installed rsync does not support", () => {
    const issues = validate(profile({ options: { mkpath: true } }), "3.1.3");
    expect(issues).toContainEqual({
      level: "error",
      key: "issue.tooOld",
      params: { option: "mkpath", since: "3.2.3", version: "3.1.3" },
    });
    expect(validate(profile({ options: { mkpath: true } }), "3.2.7")).toEqual([]);
  });

  it("rejects remote-to-remote", () => {
    const p = profile();
    p.source = { kind: "ssh", user: "", host: "a", path: "/", port: "" };
    p.dest = { kind: "ssh", user: "", host: "b", path: "/", port: "" };
    expect(validate(p).map((i) => i.key)).toContain("issue.remoteToRemote");
  });
});
