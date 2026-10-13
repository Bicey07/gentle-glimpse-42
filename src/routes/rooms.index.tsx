import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { RoomCard } from "../components/RoomCard";
import { SectionTitle } from "../components/SectionTitle";
import { CreateRoom } from "../components/rooms/CreateRoom";
import { RoomPassport } from "../components/rooms/RoomPassport";
import { useJourney } from "../lib/rooms/store";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/rooms/")({
  component: RoomsPage,
});

function RoomsPage() {
  const { t: tx } = useI18n();
  const scope = useStore((s) => s.userId ?? "guest");
  const journey = useJourney(scope);
  const rooms = useStore((s) => s.rooms);
  const mode = useStore((s) => s.mode);
  const customRooms: typeof journey.state.rooms = [];
  // 把所有人的空闲日聚合成一个柔和的「大家的时间」
  const everyone: {
    name: string;
    color: string;
    recent?: { freeDays?: string[]; weekPlan?: string };
  }[] = [];
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
      <Link
        to="/"
        className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]"
      >
        {tx("← 走廊")}
      </Link>
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          Shared Rooms
        </div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">{tx("我们的小世界")}</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">
          {tx("和朋友一起写东西、放资料、聊想法。")}
        </p>
      </header>

      {mode === "cloud" ? (
        <>
          <div className="mb-10">
            <CreateRoom />
          </div>
        </>
      ) : (
        <section className="mb-10 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-serif text-xl">{tx("登录后创建真实房间")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--quiet)]">
            {tx("房间和成员会保存到数据库。游客不会看到预置房间。")}
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex rounded-full bg-[var(--ink)] px-4 py-2 text-xs text-[var(--paper)]"
          >
            {tx("登录 / 注册")}
          </Link>
        </section>
      )}
      {customRooms.length > 0 && (
        <section className="mb-10">
          <SectionTitle>{tx("我创建或加入的小世界")}</SectionTitle>
          {customRooms.map((room) => (
            <RoomCard key={room.id} room={{ ...room, presence: tx("演示房间") }} />
          ))}
        </section>
      )}

      {/* 大家的时间 */}
      {(slots.length > 0 || wishes.length > 0) && (
        <section className="mb-12 rounded-[24px] border border-[var(--border)] bg-[var(--card)]/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.28em] text-[var(--quiet)]">
              EVERYONE'S WEEK
            </span>
            <span className="font-serif text-[12px] italic text-[var(--quiet)]">
              {tx("大家的时间")}
            </span>
          </div>

          {wishes.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 text-[11px] tracking-widest text-[var(--quiet)]">
                {tx("这周想做")}
              </div>
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
              <div className="mb-2 text-[11px] tracking-widest text-[var(--quiet)]">
                {tx("可能有空")}
              </div>
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
            {tx("不是邀约，只是看见彼此的节奏。")}
          </p>
        </section>
      )}

      <SectionTitle>{tx("小世界")}</SectionTitle>
      <div>
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} />
        ))}
      </div>
    </PageShell>
  );
}
