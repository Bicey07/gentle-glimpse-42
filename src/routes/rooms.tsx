import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { RoomCard } from "../components/RoomCard";
import { rooms } from "../data/mockData";

export const Route = createFileRoute("/rooms")({
  component: RoomsPage,
});

function RoomsPage() {
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
      <div>
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} />
        ))}
      </div>
    </PageShell>
  );
}
