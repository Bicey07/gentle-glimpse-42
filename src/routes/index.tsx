import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { MySpaceCard } from "../components/MySpaceCard";
import { FriendSpaceCard } from "../components/FriendSpaceCard";
import { RoomCard } from "../components/RoomCard";
import { TraceLine } from "../components/TraceLine";
import { SectionTitle } from "../components/SectionTitle";
import { Link } from "@tanstack/react-router";
import { me, friends, rooms, traces } from "../data/mockData";

export const Route = createFileRoute("/")({
  component: SpacePage,
});

function SpacePage() {
  const featuredFriends = friends.slice(0, 4);
  const featuredRooms = rooms.slice(0, 4);
  const recentTraces = traces.slice(0, 3);

  return (
    <PageShell>
      <header className="mb-14">
        <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--quiet)]">
          QUIET · SPACE
        </div>
        <p className="mt-4 font-serif text-[19px] leading-[1.85] text-[var(--ink)]">
          一个没有点赞和比较的生活空间。
        </p>
      </header>

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

      <p className="pt-8 text-center text-[11px] tracking-widest text-[var(--quiet)]">
        —— 在这里，可以慢慢待着 ——
      </p>
    </PageShell>
  );
}
