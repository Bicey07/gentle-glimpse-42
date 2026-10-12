import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BottomNav } from "./BottomNav";
import { useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";

export function PageShell({ children }: { children: ReactNode }) {
  const mode = useStore((state) => state.mode);
  const { t: tx } = useI18n();
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto max-w-md px-6 pb-28 pt-5">
        <div className="mb-6 flex items-center justify-end gap-2">
          <Link
            to="/auth"
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--quiet)] hover:text-[var(--ink)]"
          >
            {mode === "cloud" ? tx("账户") : tx("登录 / 注册")}
          </Link>
          <LanguageSwitcher />
        </div>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
