import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { MemoryRoom } from "../components/MemoryRoom";
import { MySpaceCard } from "../components/MySpaceCard";
import { FriendSpaceCard } from "../components/FriendSpaceCard";
import { RoomCard } from "../components/RoomCard";
import { TraceLine } from "../components/TraceLine";
import { SectionTitle } from "../components/SectionTitle";
import { useStore } from "../lib/store";
import { rooms as allRooms } from "../data/mockData";
import type { Room } from "../lib/types";

export const Route = createFileRoute("/")({
  component: SpacePage,
});

const quickActions = [
  {
    to: "/add" as const,
    search: { type: "sentence" as const },
    label: "今天留一句",
    hint: "几个字也可以",
  },
  {
    to: "/add" as const,
    search: { type: "status" as const },
    label: "更新本周状态",
    hint: "心情·在读·在看",
  },
  { to: "/friends" as const, search: undefined, label: "看看朋友", hint: "走进他们的房间" },
  { to: "/rooms" as const, search: undefined, label: "进入会客厅", hint: "一些安静的小世界" },
];

function SpacePage() {
  const me = useStore((s) => s.me);
  const friends = useStore((s) => s.friends);
  const rooms: Room[] = allRooms;
  const traces = useStore((s) => s.traces);

  const featuredFriends = friends.slice(0, 4);
  const featuredRooms = rooms.slice(0, 4);
  const recentTraces = traces.slice(0, 3);

  return (
    <PageShell>
      <header className="mb-9">
        <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--quiet)]">
          QUIET · SPACE
        </div>
        <h1 className="mt-4 font-serif text-[23px] leading-[1.65] text-[var(--ink)]">
          一间被记忆慢慢布置出来的小屋。
        </h1>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--quiet)]">
          没有点赞和比较。留下生活痕迹，也被在意的人温柔看见。
        </p>
      </header>

      <MemoryRoom name={me.name} />

      {/* Quick actions */}
      <section className="mb-14">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              search={a.search as never}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 px-4 py-4 transition-colors hover:border-[var(--bluegrey)] hover:bg-[var(--card)]"
            >
              <div className="font-serif text-[15px] text-[var(--ink)]">{a.label}</div>
              <div className="mt-1 text-[11px] text-[var(--quiet)]">{a.hint}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionTitle>My Space</SectionTitle>
        <MySpaceCard person={me} />
      </section>

      <section className="mb-16">
        <SectionTitle
          aside={
            <Link to="/friends" className="hover:text-[var(--ink)]">
              所有朋友 →
            </Link>
          }
        >
          Friends' Spaces
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {featuredFriends.map((f) => (
            <FriendSpaceCard key={f.id} person={f} />
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionTitle
          aside={
            <Link to="/rooms" className="hover:text-[var(--ink)]">
              更多 →
            </Link>
          }
        >
          Shared Rooms
        </SectionTitle>
        <div>
          {featuredRooms.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle>最近的回声</SectionTitle>
        <div className="opacity-80">
          {recentTraces.map((t) => (
            <TraceLine key={t.id} trace={t} />
          ))}
        </div>
      </section>

      <p className="pt-6 text-center text-[11px] tracking-widest text-[var(--quiet)]">
        —— 在这里，可以慢慢待着 ——
      </p>
    </PageShell>
  );
}
