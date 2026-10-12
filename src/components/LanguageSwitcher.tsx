import { Languages } from "lucide-react";
import { useI18n } from "../lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("语言")}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)]/70 p-1 text-[11px]"
    >
      <Languages size={14} aria-hidden="true" className="ml-2 mr-1 text-[var(--quiet)]" />
      {(
        [
          { value: "zh", label: "中文", lang: "zh-CN" },
          { value: "en", label: "English", lang: "en" },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.lang}
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
          className={`rounded-full px-3 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bluegrey)] ${locale === option.value ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--quiet)] hover:text-[var(--ink)]"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
