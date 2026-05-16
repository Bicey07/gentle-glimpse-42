import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto max-w-md px-6 pb-28 pt-10">{children}</div>
      <BottomNav />
    </div>
  );
}
