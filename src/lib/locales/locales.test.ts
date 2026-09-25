import { describe, expect, it } from "vitest";
import { categories, options } from "../options";
import { de } from "./de";
import { en } from "./en";
import { exitMessage, optionHelp, optionLabel, optionPlaceholder, resolveLocale, translate } from "./index";
import { categoriesDe, choicesDe, optionsDe } from "./options.de";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("German has every key, non-empty, with the same placeholders", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(de[key], key).toBeTruthy();
      expect(placeholders(de[key]), key).toEqual(placeholders(en[key]));
    }
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
  });

  it("German covers every option, category and choice exactly", () => {
    expect(Object.keys(optionsDe).sort()).toEqual(options.map((o) => o.id).sort());
    for (const [id, [label, help]] of Object.entries(optionsDe)) {
      expect(label.trim(), id).not.toBe("");
      expect(help.trim(), id).not.toBe("");
    }
    expect(Object.keys(categoriesDe).sort()).toEqual(categories.map((c) => c.id).sort());
    for (const [id, map] of Object.entries(choicesDe)) {
      const o = options.find((x) => x.id === id)!;
      expect(Object.keys(map).sort()).toEqual(o.choices!.map((c) => c.value).sort());
    }
  });
});

describe("translate", () => {
  it("fills placeholders and keeps unknown ones", () => {
    expect(translate("de", "run.files", { n: 3 })).toBe("3 Dateien");
    expect(translate("en", "run.files", { n: 3 })).toBe("3 files");
    expect(translate("en", "run.files")).toBe("{n} files");
  });

  it("explains exit codes", () => {
    expect(exitMessage("de", 23)).toBe("Teilweise Übertragung wegen eines Fehlers");
    expect(exitMessage("en", 0)).toBe("Success");
    expect(exitMessage("de", 99)).toBe("Exit-Code 99");
    expect(exitMessage("en", null)).toBe("Terminated by a signal");
  });

  it("translates option texts", () => {
    const archive = options.find((o) => o.id === "archive")!;
    expect(optionLabel("de", archive)).toBe("Archivmodus");
    expect(optionLabel("en", archive)).toBe("Archive mode");
    expect(optionHelp("de", archive)).toContain("Rekursiv");
    const bw = options.find((o) => o.id === "bwlimit")!;
    expect(optionPlaceholder("de", bw)).toBe("z. B. 5M");
    expect(optionPlaceholder("en", bw)).toBe("e.g. 5M");
  });
});

describe("resolveLocale", () => {
  it("honours an explicit choice", () => {
    expect(resolveLocale("de", ["en-US"])).toBe("de");
    expect(resolveLocale("en", ["de-DE"])).toBe("en");
  });

  it("follows the system languages and falls back to English", () => {
    expect(resolveLocale("system", ["de-AT", "en"])).toBe("de");
    expect(resolveLocale("system", ["fr-FR", "de-CH"])).toBe("de");
    expect(resolveLocale("system", ["fr-FR"])).toBe("en");
    expect(resolveLocale(undefined, [])).toBe("en");
  });
});
