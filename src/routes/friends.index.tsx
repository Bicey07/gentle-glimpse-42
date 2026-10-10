import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { FriendSpaceCard } from "../components/FriendSpaceCard";
import { actions, useStore } from "../lib/store";

export const Route = createFileRoute("/friends/")({
  component: FriendsPage,
});

function FriendsPage() {
  const friends = useStore((s) => s.friends);
  const mode = useStore((s) => s.mode);
  const loading = useStore((s) => s.loading);
  const loadError = useStore((s) => s.loadError);

  return (
    <PageShell>
      <Link to="/" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← 走廊
      </Link>
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">Friends</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">朋友们各自的房间</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">
          {mode === "demo" ? "这些是示例房间。轻轻推开任意一扇门看看。" : "轻轻推开任意一扇门看看。"}
        </p>
      </header>
      {loading ? (
        <p className="py-10 text-center text-xs text-[var(--quiet)]">正在推开门…</p>
      ) : loadError ? (
        <p role="alert" className="py-10 text-center text-xs text-[var(--bluegrey)]">没能读到朋友们的房间：{loadError}</p>
      ) : friends.length === 0 ? (
        <p className="py-10 text-center text-xs text-[var(--quiet)]">还没有朋友的房间。可以把好友码给在意的人。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {friends.map((f) => (
            <FriendSpaceCard key={f.id} person={f} />
          ))}
        </div>
      )}
      {mode === "cloud" && <FriendDoor />}
    </PageShell>
  );
}

function FriendDoor() {
  const userId = useStore((s) => s.userId);
  const incoming = useStore((s) => s.incomingRequests);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await actions.requestFriend(code);
    setBusy(false);
    setMsg(res.ok ? "已经敲了门，等 TA 开门。" : res.message);
    if (res.ok) setCode("");
  };

  const accept = async (id: string) => {
    setBusy(true);
    const res = await actions.acceptFriend(id);
    setBusy(false);
    setMsg(res.ok ? "门打开了。" : `没能开门：${res.message}`);
  };

  return (
    <section className="mt-14 space-y-6 rounded-[24px] border border-[var(--border)] bg-[var(--card)]/60 p-5">
      {incoming.length > 0 && (
        <div>
          <div className="mb-3 text-[10px] tracking-[0.28em] text-[var(--quiet)]">有人在敲门</div>
          <ul className="space-y-2">
            {incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="font-serif">{r.fromName}</span>
                <button disabled={busy} onClick={() => accept(r.id)} className="rounded-full border border-[var(--ink)] px-4 py-1 text-xs hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50">
                  开门
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <div className="mb-2 text-[10px] tracking-[0.28em] text-[var(--quiet)]">我的好友码</div>
        <code className="block select-all break-all text-[11px] text-[var(--ink)]/80">{userId}</code>
      </div>
      <form onSubmit={send} className="space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="贴上朋友的好友码"
          className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--quiet)]" role="status">{msg ?? "对方开门后，你们才能看到彼此的 Friends 内容。"}</span>
          <button type="submit" disabled={busy || !code.trim()} className="shrink-0 rounded-full border border-[var(--ink)] px-4 py-1 text-xs hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50">
            敲门
          </button>
        </div>
      </form>
    </section>
  );
}
