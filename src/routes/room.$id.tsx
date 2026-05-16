import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { rooms } from "../data/mockData";

export const Route = createFileRoute("/room/$id")({
  component: RoomPage,
});

function RoomPage() {
  const { id } = Route.useParams();
  const room = rooms.find((r) => r.id === id);

  if (!room) {
    return (
      <PageShell>
        <p className="py-20 text-center text-sm text-[var(--quiet)]">这个房间还不存在。</p>
        <div className="text-center"><Link to="/rooms" className="text-sm text-[var(--bluegrey)]">回到 Rooms</Link></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link to="/rooms" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← Rooms
      </Link>
      <header className="mb-12">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: room.color }} />
          Shared Room
        </div>
        <h1 className="mt-4 font-serif text-2xl text-[var(--ink)]">{room.name}</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">{room.description}</p>
      </header>

      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="font-serif text-[17px] text-[var(--ink)]/85 leading-[1.9]">
          这里还很安静。
        </p>
        <p className="mt-2 text-xs text-[var(--quiet)]">过几天再来看看。</p>

        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="inline-block h-6 w-6 rounded-full"
              style={{ backgroundColor: room.color, opacity: 0.35 + i * 0.15 }}
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[var(--quiet)]">{room.presence}</p>
      </section>

      <div className="mt-10 text-center">
        <button className="rounded-full border border-[var(--ink)]/60 px-6 py-2 text-sm text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors">
          安静地进来
        </button>
      </div>
    </PageShell>
  );
}
