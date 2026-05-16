import type { ReactNode } from "react";

export function SectionTitle({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
        {children}
      </h2>
      {aside && <div className="text-xs text-[var(--quiet)]">{aside}</div>}
    </div>
  );
}
