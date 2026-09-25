// Reactive UI language. Components call `t(...)`; because `t` reads
// `i18n.locale`, everything re-renders when the language changes.

import * as L from "./locales";
import type { Category, RsyncOption } from "./options";

const systemLanguages = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];

class I18n {
  locale = $state<L.Locale>(L.resolveLocale("system", systemLanguages));

  setPreference(pref: L.LanguagePref) {
    this.locale = L.resolveLocale(pref, systemLanguages);
  }
}

export const i18n = new I18n();

export const t = (key: L.MessageKey, params?: L.Params) => L.translate(i18n.locale, key, params);
export const exitMessage = (code: number | null) => L.exitMessage(i18n.locale, code);
export const optionLabel = (o: RsyncOption) => L.optionLabel(i18n.locale, o);
export const optionHelp = (o: RsyncOption) => L.optionHelp(i18n.locale, o);
export const optionPlaceholder = (o: RsyncOption) => L.optionPlaceholder(i18n.locale, o);
export const choiceLabel = (o: RsyncOption, value: string, label: string) => L.choiceLabel(i18n.locale, o, value, label);
export const categoryLabel = (c: Category) => L.categoryLabel(i18n.locale, c);
export const categoryBlurb = (c: Category) => L.categoryBlurb(i18n.locale, c);
export const formatDate = (ms: number) => new Date(ms).toLocaleString(i18n.locale);
