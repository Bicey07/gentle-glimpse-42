import { Link, useRouterState } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

const items = [
  { to: "/", label: "空间", glyph: "⌂" },
  { to: "/friends", label: "好友", glyph: "◍" },
  { to: "/add", label: "记录", glyph: "＋" },
  { to: "/rooms", label: "房间", glyph: "▢" },
  { to: "/me", label: "我的", glyph: "·" },
] as const;

export function BottomNav() {
  const { t: tx } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
        {items.map((it) => {
          const active = path === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex flex-col items-center gap-1 text-[11px] tracking-wider transition-opacity"
              style={{
                color: active ? "var(--ink)" : "var(--quiet)",
                opacity: active ? 1 : 0.6,
              }}
            >
              <span className="font-serif text-base leading-none">{it.glyph}</span>
              <span>{tx(it.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
