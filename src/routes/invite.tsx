import * as workspace from "../lib/workspace/api";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { JourneyButton, JourneyLabel, LocalNotice } from "../components/rooms/JourneyUi";
import { decodeInvite, errorText } from "../lib/rooms/model";
import { useJourney } from "../lib/rooms/store";
import { session, useStore } from "../lib/store";

export const Route = createFileRoute("/invite")({
  validateSearch: (search: Record<string, unknown>): { room?: string; token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
    room: typeof search.room === "string" ? search.room : undefined,
  }),
  component: InvitationRouter,
});
function InvitationRouter() {
  const { token } = Route.useSearch();
  return token ? <CloudInvitation key={token} token={token} /> : <InvitationPage />;
}
function CloudInvitation({ token }: { token: string }) {
  const userId = useStore((s) => s.userId);
  const [room, setRoom] = useState<Awaited<ReturnType<typeof workspace.previewInvite>> | null>(
    null,
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let live = true;
    workspace
      .previewInvite(token)
      .then((r) => {
        if (live) setRoom(r);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [token]);
  return (
    <PageShell>
      <Link to="/rooms" className="text-xs">
        ← 小世界
      </Link>
      <section className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-[10px] tracking-[.25em] text-[var(--quiet)]">AN INVITATION FOR YOU</p>
        {!room && !error && <p className="mt-5">正在打开邀请…</p>}
        {room && (
          <>
            <h1 className="mt-4 font-serif text-2xl">{room.name}</h1>
            <p className="mt-3 whitespace-pre-wrap text-sm">{room.description}</p>
            <p className="my-5 text-sm text-[var(--quiet)]">
              加入后，你可以阅读小组内容、一起编辑页面、上传资料和发表评论。
            </p>
            {userId ? (
              <JourneyButton
                disabled={busy}
                onClick={async () => {
                  if (busy) return;
                  setBusy(true);
                  setError("");
                  try {
                    const id = await workspace.acceptInvite(token, userId);
                    await session.refresh();
                    void navigate({ to: "/rooms/$id", params: { id } });
                  } catch (e) {
                    setError(errorText(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "正在加入…" : "接受邀请 · 加入小组"}
              </JourneyButton>
            ) : (
              <Link
                to="/auth"
                search={{ next: `/invite?token=${token}` }}
                className="inline-block rounded-full bg-[var(--ink)] px-5 py-3 text-xs text-[var(--paper)]"
              >
                登录后加入
              </Link>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm">
            {error}
          </p>
        )}
      </section>
    </PageShell>
  );
}
function InvitationPage() {
  const { t: tx } = useI18n();
  const { room: encoded } = Route.useSearch();
  const scope = useStore((s) => s.userId ?? "guest");
  const journey = useJourney(scope);
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  let room;
  try {
    room = decodeInvite(encoded ?? "");
  } catch (error) {
    return (
      <PageShell>
        <JourneyLabel>Room invitation</JourneyLabel>
        <h1 className="mt-5 font-serif text-2xl">{tx("这封邀请没能打开。")}</h1>
        <p role="alert" className="mt-4 text-sm text-[var(--quiet)]">
          {tx(errorText(error))}
        </p>
        <Link to="/rooms" className="mt-8 inline-block text-xs underline">
          {tx("回到小世界")}
        </Link>
      </PageShell>
    );
  }
  const invitedRoom = room;
  return (
    <PageShell>
      <Link to="/rooms" className="text-xs text-[var(--quiet)]">
        {tx("← 小世界")}
      </Link>
      <div className="mt-10 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-36 items-center justify-center" style={{ background: room.color }}>
          <KeyRound size={48} strokeWidth={1} className="opacity-60" />
        </div>
        <div className="p-6">
          <JourneyLabel>You are invited</JourneyLabel>
          <h1 className="mt-4 font-serif text-2xl">{room.name}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--quiet)]">
            {room.description || tx("一个可以慢慢待着的小世界。")}
          </p>
          <p className="my-5 text-xs leading-relaxed text-[var(--quiet)]">
            {tx(
              "这是一封可转发的演示邀请，尚未验证发起人身份。加入后可以收下 Room Key，再选择是否放进钱包。",
            )}
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
            {tx("接受邀请 · 收下 Room Key")}
          </JourneyButton>
          <LocalNotice />
          {(notice || journey.error) && (
            <p role="alert" className="mt-3 text-xs">
              {tx(notice || journey.error || "")}
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
