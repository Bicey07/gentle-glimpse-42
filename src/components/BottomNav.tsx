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
    <nav aria-label={tx("空间")} className="reverie-nav fixed inset-x-0 bottom-0 z-20 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
        {items.map((it) => {
          const active = it.to === "/" ? path === "/" : path === it.to || path.startsWith(`${it.to}/`);
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-1 text-[11px] tracking-wider transition-opacity"
              style={{
                color: active ? "#58536c" : "#737d90",
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
