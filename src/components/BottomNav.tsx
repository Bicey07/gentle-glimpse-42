import { Link, useRouterState } from "@tanstack/react-router";

const items = [
  { to: "/", label: "Home", glyph: "○" },
  { to: "/add", label: "Add", glyph: "＋" },
  { to: "/me", label: "Me", glyph: "·" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-6 py-3">
        {items.map((it) => {
          const active = path === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex flex-col items-center gap-1 text-[11px] tracking-wider transition-opacity"
              style={{
                color: active ? "var(--ink)" : "var(--quiet)",
                opacity: active ? 1 : 0.7,
              }}
            >
              <span className="font-serif text-lg leading-none">{it.glyph}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
