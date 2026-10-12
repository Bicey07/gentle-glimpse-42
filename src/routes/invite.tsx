import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { JourneyButton, JourneyLabel, LocalNotice } from "../components/rooms/JourneyUi";
import { decodeInvite, errorText } from "../lib/rooms/model";
import { useJourney } from "../lib/rooms/store";
import { useStore } from "../lib/store";
import { rooms } from "../data/mockData";

export const Route = createFileRoute("/invite")({
  validateSearch: (search: Record<string, unknown>): { room?: string } => ({
    room: typeof search.room === "string" ? search.room : undefined,
  }),
  component: InvitationPage,
});
function InvitationPage() {
  const { room: encoded } = Route.useSearch();
  const scope = useStore((s) => s.userId ?? "guest");
  const journey = useJourney(scope);
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  let room;
  try {
    room = decodeInvite(encoded ?? "");
    const known = rooms.find((r) => r.id === room!.id);
    if (
      known &&
      (known.name !== room.name ||
        known.description !== room.description ||
        known.color !== room.color)
    )
      throw new Error("邀请中的房间信息不一致。");
  } catch (error) {
    return (
      <PageShell>
        <JourneyLabel>Room invitation</JourneyLabel>
        <h1 className="mt-5 font-serif text-2xl">这封邀请没能打开。</h1>
        <p role="alert" className="mt-4 text-sm text-[var(--quiet)]">
          {errorText(error)}
        </p>
        <Link to="/rooms" className="mt-8 inline-block text-xs underline">
          回到小世界
        </Link>
      </PageShell>
    );
  }
  const invitedRoom = room;
  return (
    <PageShell>
      <Link to="/rooms" className="text-xs text-[var(--quiet)]">
        ← 小世界
      </Link>
      <div className="mt-10 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-36 items-center justify-center" style={{ background: room.color }}>
          <KeyRound size={48} strokeWidth={1} className="opacity-60" />
        </div>
        <div className="p-6">
          <JourneyLabel>You are invited</JourneyLabel>
          <h1 className="mt-4 font-serif text-2xl">{room.name}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--quiet)]">
            {room.description || "一个可以慢慢待着的小世界。"}
          </p>
          <p className="my-5 text-xs leading-relaxed text-[var(--quiet)]">
            这是一封可转发的演示邀请，尚未验证发起人身份。加入后可以收下 Room
            Key，再选择是否放进钱包。
          </p>
          <JourneyButton
            disabled={!!journey.error}
            onClick={() => {
              try {
                journey.join(invitedRoom);
                void navigate({ to: "/rooms/$id", params: { id: invitedRoom.id } });
              } catch (error) {
                setNotice(errorText(error));
              }
            }}
          >
            接受邀请 · 收下 Room Key
          </JourneyButton>
          <LocalNotice />
          {(notice || journey.error) && (
            <p role="alert" className="mt-3 text-xs">
              {notice || journey.error}
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
