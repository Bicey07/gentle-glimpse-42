import { Link } from "@tanstack/react-router";
import { BookOpen, Download, KeyRound } from "lucide-react";
import { exportJson } from "../../lib/rooms/model";
import { useJourney } from "../../lib/rooms/store";
import { useStore } from "../../lib/store";
import { JourneyButton, JourneyLabel, LocalNotice } from "./JourneyUi";

export function RoomPassport() {
  const scope = useStore((s) => s.userId ?? "guest");
  const { state, error } = useJourney(scope);
  return (
    <section className="mb-8 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-start justify-between gap-3 p-6 pb-4">
        <div>
          <JourneyLabel>Room Passport</JourneyLabel>
          <h2 className="mt-3 font-serif text-xl">属于你的小世界</h2>
        </div>
        <BookOpen size={28} strokeWidth={1} className="text-[var(--bluegrey)]" />
      </div>
      <div className="px-6 pb-6">
        <p className="text-xs leading-relaxed text-[var(--quiet)]">
          带走的不是内容，而是「我曾在这里」。
        </p>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-800">
            {error}
          </p>
        )}
        {state.keys.length === 0 ? (
          <div className="my-5 rounded-2xl border border-dashed border-[var(--border)] p-5 text-center">
            <KeyRound size={22} strokeWidth={1} className="mx-auto text-[var(--quiet)]" />
            <p className="mt-3 text-xs text-[var(--quiet)]">
              加入一个小世界，收下第一把 Room Key。
            </p>
          </div>
        ) : (
          <ul className="my-5 space-y-2">
            {state.keys.map((key) => {
              const room = state.rooms.find((r) => r.id === key.roomId);
              return (
                <li key={key.roomId}>
                  <Link
                    to="/rooms/$id"
                    params={{ id: key.roomId }}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3"
                  >
                    <span
                      style={{ background: room?.color }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    >
                      <KeyRound size={16} strokeWidth={1.3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-sm">{room?.name ?? "小世界"}</div>
                      <div className="mt-1 text-[10px] text-[var(--quiet)]">
                        {key.receipt?.status === "confirmed"
                          ? "Devnet · 不可转让"
                          : key.receipt?.status === "pending"
                            ? "交易待确认"
                            : "本地 Room Key · 未上链"}
                      </div>
                    </div>
                    <span aria-hidden>↗</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {state.keys.length > 0 && (
          <JourneyButton
            secondary
            onClick={() =>
              exportJson("quiet-space-passport.json", {
                format: "quiet-space-passport-v1",
                network: "solana:devnet",
                exportedAt: new Date().toISOString(),
                rooms: state.rooms,
                keys: state.keys,
              })
            }
          >
            <Download size={13} />
            导出我的护照
          </JourneyButton>
        )}
        <LocalNotice />
      </div>
    </section>
  );
}
