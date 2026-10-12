import { useI18n } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { actions, useStore } from "../lib/store";
import { useJourney } from "../lib/rooms/store";
import { RoomJourney } from "../components/rooms/RoomJourney";

export const Route = createFileRoute("/rooms/$id")({
  component: RoomPage,
});

function RoomPage() {
  const { t: tx } = useI18n();
  const { id } = Route.useParams();
  const scope = useStore((s) => s.userId ?? "guest");
  const journey = useJourney(scope);
  const localRoom = journey.state.rooms.find((r) => r.id === id);
  const room = localRoom ? { ...localRoom, presence: tx("本地创建的房间") } : undefined;

  // Select the whole array (stable ref); derive filtered list in useMemo.
  const allNotes = useStore((s) => s.roomNotes);
  const roomNotes = useMemo(
    () => (allNotes ?? []).filter((n) => n.roomId === id).sort((a, b) => b.at - a.at),
    [allNotes, id],
  );

  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; login?: boolean } | null>(null);
  const mode = useStore((s) => s.mode);
  const myRooms = useStore((s) => s.myRooms);
  const loading = useStore((s) => s.loading);

  const everyone: Array<{ name: string; color: string; recent?: { freeDays?: string[] } }> = [];
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
        <Link
          to="/rooms"
          className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]"
        >
          ← Rooms
        </Link>
        <p className="py-20 text-center font-serif text-[15px] text-[var(--quiet)]">
          {tx("房间不存在。")}
        </p>
      </PageShell>
    );
  }

  const people: string[] = [];
  const isExhibition = false;

  const isMember = mode === "cloud" && myRooms.includes(room.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setNote(null);
    const res = await actions.addRoomNote(room.id, text);
    setBusy(false);
    if (!res.ok) {
      setNote({
        text: res.reason === "auth" ? "登录后才能在房间里留一句。" : `没能留下：${res.message}`,
        login: res.reason === "auth",
      });
      return;
    }
    setText("");
    setSent(true);
    setTimeout(() => setSent(false), 1600);
  };

  const join = async () => {
    setBusy(true);
    setNote(null);
    const res = await actions.joinRoom(room.id);
    setBusy(false);
    if (!res.ok) setNote({ text: `没能进入：${res.message}` });
  };

  return (
    <PageShell>
      <Link
        to="/rooms"
        className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]"
      >
        ← Rooms
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: room.color }}
          />
          Shared Room
        </div>
        <h1 className="mt-4 font-serif text-2xl text-[var(--ink)]">{room.name}</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">{room.description}</p>
      </header>

      <RoomJourney
        room={{ id: room.id, name: room.name, description: room.description, color: room.color }}
      />

      {room && (
        <>
          <section className="mb-10 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-3 text-[10px] tracking-[0.28em] text-[var(--quiet)]">
              {tx("这里的人")}
            </div>
            <div className="flex flex-wrap gap-2">
              {people.map((n) => (
                <span
                  key={n}
                  className="rounded-full border border-[var(--border)] bg-[var(--paper)] px-3 py-1 text-[12px] text-[var(--ink)]/80"
                >
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-[var(--quiet)]">
              {tx(room.presence)}
              {tx("。安静地在这里。")}
            </p>
          </section>

          {isExhibition && freeSlots.length > 0 && (
            <section className="mb-10">
              <SectionTitle>{tx("大家可能有空的时间")}</SectionTitle>
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
              <p className="mt-3 text-[11px] text-[var(--quiet)]">
                {tx("不是邀约，只是看见彼此的节奏。")}
              </p>
            </section>
          )}

          <section className="mb-10">
            <SectionTitle>{tx("最近的纸条")}</SectionTitle>
            {loading ? (
              <p className="py-6 text-center text-xs text-[var(--quiet)]">{tx("正在推开门…")}</p>
            ) : mode === "cloud" && !isMember ? (
              <div className="py-6 text-center text-xs text-[var(--quiet)]">
                <p>{tx("纸条只有房间里的人能看到。")}</p>
                <button
                  type="button"
                  onClick={join}
                  disabled={busy}
                  className="mt-4 rounded-full border border-[var(--ink)] px-5 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50"
                >
                  {busy ? tx("稍等…") : tx("进入这个房间")}
                </button>
              </div>
            ) : roomNotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--quiet)]">{tx("这里还很安静。")}</p>
            ) : (
              <ul className="space-y-3">
                {roomNotes.slice(0, 8).map((n) => (
                  <li
                    key={n.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 px-4 py-3"
                  >
                    <div className="text-[10px] tracking-widest text-[var(--quiet)]">
                      {n.fromName}
                    </div>
                    <p className="mt-1 font-serif text-[15px] leading-[1.8] text-[var(--ink)]/90">
                      {n.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <SectionTitle>{tx("留一句")}</SectionTitle>
            <form onSubmit={submit} className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isExhibition ? tx("留一句话") : tx("在这里留一句话")}
                rows={3}
                className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 font-serif text-[15px] leading-relaxed outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--quiet)]">
                  {note
                    ? tx(note.text)
                    : sent
                      ? tx("已经放在这个房间。")
                      : mode === "cloud" && !isMember
                        ? tx("留下第一句时会自动进入这个房间。")
                        : tx("房间里的人会看到。")}
                  {note?.login && (
                    <Link to="/auth" className="ml-2 text-[var(--bluegrey)]">
                      {tx("去登录 →")}
                    </Link>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={busy}
                  className="disabled:opacity-50 rounded-full border border-[var(--ink)] px-5 py-1.5 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                >
                  {busy ? tx("正在留下…") : tx("留在这个房间")}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </PageShell>
  );
}
