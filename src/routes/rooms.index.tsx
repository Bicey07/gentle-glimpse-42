import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { RoomCard } from "../components/RoomCard";
import { SectionTitle } from "../components/SectionTitle";
import { rooms, friends, me } from "../data/mockData";

export const Route = createFileRoute("/rooms/")({
  component: RoomsPage,
});

function RoomsPage() {
  // 把所有人的空闲日聚合成一个柔和的「大家的时间」
  const everyone = [me, ...friends];
  const slots = everyone
    .flatMap((p) =>
      (p.recent?.freeDays ?? []).map((d) => ({ name: p.name, day: d, color: p.color })),
    )
    .slice(0, 6);

  const wishes = everyone
    .filter((p) => p.recent?.weekPlan)
    .slice(0, 3)
    .map((p) => ({ name: p.name, wish: p.recent!.weekPlan!, color: p.color }));

  return (
    <PageShell>
      <Link to="/" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← 走廊
      </Link>
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">Shared Rooms</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">一些小世界</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">里面有几个人在安静地待着。</p>
      </header>

      {/* 大家的时间 */}
      {(slots.length > 0 || wishes.length > 0) && (
        <section className="mb-12 rounded-[24px] border border-[var(--border)] bg-[var(--card)]/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.28em] text-[var(--quiet)]">
              EVERYONE'S WEEK
            </span>
            <span className="font-serif text-[12px] italic text-[var(--quiet)]">
              大家的时间
            </span>
          </div>

          {wishes.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 text-[11px] tracking-widest text-[var(--quiet)]">这周想做</div>
              <ul className="space-y-1.5 text-[13px] text-[var(--ink)]/85">
                {wishes.map((w) => (
                  <li key={w.name} className="flex items-baseline gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="text-[var(--quiet)]">{w.name}</span>
                    <span>{w.wish}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {slots.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] tracking-widest text-[var(--quiet)]">可能有空</div>
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[var(--border)] bg-[var(--paper)] px-2.5 py-0.5 text-[11px] text-[var(--ink)]/75"
                  >
                    <span className="text-[var(--quiet)]">{s.name}·</span>
                    {s.day}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-5 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--quiet)]">
            不是邀约，只是看见彼此的节奏。
          </p>
        </section>
      )}

      <SectionTitle>小世界</SectionTitle>
      <div>
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} />
        ))}
      </div>
    </PageShell>
  );
}
