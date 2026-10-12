import en from "./en.json";

export type Locale = "zh" | "en";
export type TranslationValues = Record<string, string | number>;
export type Translator = (message: string, values?: TranslationValues) => string;
export const LOCALE_STORAGE_KEY = "quiet-space:locale:v1";
export const DEFAULT_LOCALE: Locale = "zh";
export const englishMessages: Readonly<Record<string, string>> = en;

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}
export function readLocale(storage?: Pick<Storage, "getItem">): Locale {
  try {
    const value = storage?.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
export function saveLocale(locale: Locale, storage?: Pick<Storage, "setItem">): void {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* Switching still works without storage. */
  }
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.keys(en)
  .filter((key) => /\{\w+\}/.test(key))
  .map((key) => {
    const names: string[] = [];
    const parts = key.split(/(\{\w+\})/);
    const pattern = parts
      .map((part) => {
        if (/^\{\w+\}$/.test(part)) {
          names.push(part.slice(1, -1));
          return "([\\s\\S]*?)";
        }
        return escapeRegex(part);
      })
      .join("");
    return { key, names, regex: new RegExp(`^${pattern}$`) };
  });

/** Translate UI messages only. Never pass user-authored content into this function. */
export function translate(message: string, locale: Locale, values: TranslationValues = {}): string {
  let template = message;
  let parameters = values;
  if (locale === "en") {
    const direct = englishMessages[message];
    if (direct) template = direct;
    else {
      // Existing validation and error helpers return Chinese strings. Resolve
      // known message templates without changing the underlying error or user data.
      for (const entry of patterns) {
        const match = entry.regex.exec(message);
        if (!match) continue;
        template = englishMessages[entry.key];
        parameters = Object.fromEntries(entry.names.map((name, index) => [name, match[index + 1]]));
        break;
      }
    }
  }
  return template.replace(/\{(\w+)\}/g, (token, key: string) => {
    const value = parameters[key];
    if (value === undefined) return token;
    return key === "message" ? translate(String(value), locale) : String(value);
  });
}
export function dateLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "zh-CN";
}

const moodLabels = new Set(["平静", "想念", "在恢复", "缓慢", "有点累", "明亮", "还没有更新"]);
export function moodLabel(mood: string, t: Translator): string {
  return moodLabels.has(mood) ? t(mood) : mood;
}
