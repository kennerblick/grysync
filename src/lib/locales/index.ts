import type { Category, RsyncOption } from "../options";
import { de } from "./de";
import { en, type MessageKey, type Messages } from "./en";
import { categoriesDe, choicesDe, optionsDe, placeholderDe } from "./options.de";

export type { MessageKey } from "./en";
export type Locale = "en" | "de";
export type LanguagePref = "system" | Locale;

export const locales: { id: Locale; label: string }[] = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
];

const dictionaries: Record<Locale, Messages> = { en, de };

export type Params = Record<string, string | number>;

export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const text = dictionaries[locale][key] ?? en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

export function isMessageKey(key: string): key is MessageKey {
  return key in en;
}

/** Picks the UI language from the preference and the system language list. */
export function resolveLocale(pref: LanguagePref | undefined, systemLanguages: readonly string[]): Locale {
  if (pref === "en" || pref === "de") return pref;
  for (const lang of systemLanguages) {
    const base = lang.toLowerCase().split("-")[0];
    if (base === "de" || base === "en") return base;
  }
  return "en";
}

export function exitMessage(locale: Locale, code: number | null): string {
  if (code === null) return translate(locale, "exit.signal");
  const key = `exit.${code}`;
  return isMessageKey(key) ? translate(locale, key) : translate(locale, "exit.other", { code });
}

export function optionLabel(locale: Locale, o: RsyncOption): string {
  return (locale === "de" && optionsDe[o.id]?.[0]) || o.label;
}

export function optionHelp(locale: Locale, o: RsyncOption): string {
  return (locale === "de" && optionsDe[o.id]?.[1]) || o.help;
}

export function optionPlaceholder(locale: Locale, o: RsyncOption): string | undefined {
  return locale === "de" && o.placeholder ? placeholderDe(o.placeholder) : o.placeholder;
}

export function choiceLabel(locale: Locale, o: RsyncOption, value: string, label: string): string {
  return (locale === "de" && choicesDe[o.id]?.[value]) || label;
}

export function categoryLabel(locale: Locale, c: Category): string {
  return locale === "de" ? categoriesDe[c.id].label : c.label;
}

export function categoryBlurb(locale: Locale, c: Category): string {
  return locale === "de" ? categoriesDe[c.id].blurb : c.blurb;
}

/** All searchable texts of an option in every language. */
export function optionSearchTexts(o: RsyncOption): string[] {
  const de = optionsDe[o.id];
  return de ? [o.label, o.help, ...de] : [o.label, o.help];
}
