import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { rooms, friends, me } from "../data/mockData";
import { actions, useStore } from "../lib/store";

export const Route = createFileRoute("/rooms/$id")({
  component: RoomPage,
});

const roomPeople: Record<string, string[]> = {
  "tokyo-life": ["林一", "阿野", "小满"],
  "weekend-exhibition": ["青羽", "林一", "安安"],
  reading: ["阿野", "木子"],
  morning: ["安安", "小满"],
  "night-writers": ["木子", "林一"],
};

function RoomPage() {
  const { id } = Route.useParams();
  const room = rooms.find((r) => r.id === id);

  // Select the whole array (stable ref); derive filtered list in useMemo.
  const allNotes = useStore((s) => s.roomNotes);
  const roomNotes = useMemo(
    () =>
      (allNotes ?? [])
        .filter((n) => n.roomId === id)
        .sort((a, b) => b.at - a.at),
    [allNotes, id],
  );

  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const everyone = useMemo(() => [me, ...friends], []);
  const freeSlots = useMemo(
    () =>
      everyone
        .flatMap((p) =>
          (p.recent?.freeDays ?? []).map((d) => ({ name: p.name, day: d, color: p.color })),
        )
        .slice(0, 6),
    [everyone],
  );

  if (!room) {
    return (
      <PageShell>
        <Link to="/rooms" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
          ← Rooms
        </Link>
        <p className="py-20 text-center font-serif text-[15px] text-[var(--quiet)]">房间不存在。</p>
      </PageShell>
    );
  }

  const people = roomPeople[room.id] ?? [];
  const isExhibition = room.id === "weekend-exhibition";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    actions.addRoomNote(room.id, text);
    setText("");
    setSent(true);
    setTimeout(() => setSent(false), 1600);
  };

  return (
    <PageShell>
      <Link to="/rooms" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← Rooms
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: room.color }} />
          Shared Room
        </div>
        <h1 className="mt-4 font-serif text-2xl text-[var(--ink)]">{room.name}</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">{room.description}</p>
      </header>

      <section className="mb-10 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-3 text-[10px] tracking-[0.28em] text-[var(--quiet)]">这里的人</div>
        <div className="flex flex-wrap gap-2">
          {(people.length ? people : ["几位朋友"]).map((n) => (
            <span
              key={n}
              className="rounded-full border border-[var(--border)] bg-[var(--paper)] px-3 py-1 text-[12px] text-[var(--ink)]/80"
            >
              {n}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-[var(--quiet)]">{room.presence}。安静地在这里。</p>
      </section>

      {isExhibition && freeSlots.length > 0 && (
        <section className="mb-10">
          <SectionTitle>大家可能有空的时间</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {freeSlots.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--border)] bg-[var(--paper)] px-2.5 py-0.5 text-[11px] text-[var(--ink)]/75"
              >
                <span className="text-[var(--quiet)]">{s.name}·</span>
                {s.day}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--quiet)]">不是邀约，只是看见彼此的节奏。</p>
        </section>
      )}

      <section className="mb-10">
        <SectionTitle>最近的纸条</SectionTitle>
        {roomNotes.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--quiet)]">这里还很安静。</p>
        ) : (
          <ul className="space-y-3">
            {roomNotes.slice(0, 8).map((n) => (
              <li
                key={n.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 px-4 py-3"
              >
                <div className="text-[10px] tracking-widest text-[var(--quiet)]">{n.fromName}</div>
                <p className="mt-1 font-serif text-[15px] leading-[1.8] text-[var(--ink)]/90">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle>留一句</SectionTitle>
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isExhibition ? "留一句话" : "在这里留一句话"}
            rows={3}
            className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 font-serif text-[15px] leading-relaxed outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--quiet)]">
              {sent ? "已经放在这个房间。" : "房间里的人会看到。"}
            </span>
            <button
              type="submit"
              className="rounded-full border border-[var(--ink)] px-5 py-1.5 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              留在这个房间
            </button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
