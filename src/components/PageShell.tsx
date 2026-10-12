import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BottomNav } from "./BottomNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto max-w-md px-6 pb-28 pt-5">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
