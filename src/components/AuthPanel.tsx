import { useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { actions, useStore } from "../lib/store";

export function AuthPanel() {
  const mode = useStore((s) => s.mode);
  const userId = useStore((s) => s.userId);
  const currentEmail = useStore((s) => s.email);
  const loading = useStore((s) => s.loading);
  const loadError = useStore((s) => s.loadError);
  const requests = useStore((s) => s.incomingRequests);

  const [view, setView] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (view === "signup") {
        if (!displayName.trim()) throw new Error("先写一个想被朋友看到的名字。");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
        setNotice(data.session ? "账号已经准备好，欢迎回来。" : "注册成功，请查收确认邮件后登录。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setNotice("已经回到你的房间。");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "暂时无法登录，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    setNotice(error ? error.message : "已经退出，当前显示的是体验内容。");
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await actions.requestFriend(friendCode);
    setBusy(false);
    setNotice(result.ok ? "好友邀请已经送出。" : result.message);
    if (result.ok) setFriendCode("");
  }

  async function acceptFriend(id: string) {
    setBusy(true);
    const result = await actions.acceptFriend(id);
    setBusy(false);
    setNotice(result.ok ? "你们已经可以看见彼此的房间。" : result.message);
  }

  if (mode === "cloud" && userId) {
    return (
      <section className="mb-10 rounded-[24px] border border-[var(--border)] bg-[var(--card)]/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--quiet)]">
              Cloud account
            </div>
            <p className="mt-2 text-sm text-[var(--ink)]">{currentEmail}</p>
            <p className="mt-1 text-[11px] text-[var(--quiet)]">
              {loading ? "正在整理你的房间…" : "生活痕迹会安全保存到云端。"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="text-xs text-[var(--bluegrey)] disabled:opacity-50"
          >
            退出
          </button>
        </div>

        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <div className="text-[10px] tracking-widest text-[var(--quiet)]">我的好友码</div>
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard.writeText(userId).then(() => setNotice("好友码已复制。"))
            }
            className="mt-2 max-w-full break-all text-left font-mono text-[11px] text-[var(--ink)]/75"
          >
            {userId} · 点击复制
          </button>
          <form onSubmit={addFriend} className="mt-4 flex gap-2">
            <input
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="粘贴朋友的好友码"
              className="min-w-0 flex-1 border-b border-[var(--border)] bg-transparent py-2 text-xs outline-none focus:border-[var(--bluegrey)]"
            />
            <button
              type="submit"
              disabled={busy || !friendCode.trim()}
              className="rounded-full border border-[var(--ink)] px-4 text-xs disabled:opacity-40"
            >
              邀请
            </button>
          </form>
        </div>

        {requests.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
            <div className="text-[10px] tracking-widest text-[var(--quiet)]">等你开门</div>
            {requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between text-sm">
                <span>{request.fromName}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void acceptFriend(request.id)}
                  className="text-xs text-[var(--bluegrey)] disabled:opacity-40"
                >
                  接受
                </button>
              </div>
            ))}
          </div>
        )}

        {(notice || loadError) && (
          <p className="mt-4 text-xs text-[var(--quiet)]">{notice || loadError}</p>
        )}
      </section>
    );
  }

  return (
    <section className="mb-10 rounded-[24px] border border-[var(--border)] bg-[var(--card)]/70 p-5">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--quiet)]">
        Keep your room
      </div>
      <h2 className="mt-2 font-serif text-lg text-[var(--ink)]">登录后，痕迹才会留在云端。</h2>
      <p className="mt-1 text-xs leading-relaxed text-[var(--quiet)]">
        现在看到的是体验内容，不会自动上传。
      </p>

      <div className="mt-5 flex gap-4 text-xs">
        <button
          type="button"
          onClick={() => setView("signin")}
          className={view === "signin" ? "text-[var(--ink)]" : "text-[var(--quiet)]"}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => setView("signup")}
          className={view === "signup" ? "text-[var(--ink)]" : "text-[var(--quiet)]"}
        >
          创建账号
        </button>
      </div>

      <form onSubmit={submitAuth} className="mt-4 space-y-3">
        {view === "signup" && (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="你想被怎样称呼"
            maxLength={40}
            className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none focus:border-[var(--bluegrey)]"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none focus:border-[var(--bluegrey)]"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码（至少 8 位）"
          className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none focus:border-[var(--bluegrey)]"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-full border border-[var(--ink)] py-2.5 text-sm disabled:opacity-50"
        >
          {busy ? "请稍等…" : view === "signin" ? "回到我的房间" : "创建我的房间"}
        </button>
      </form>
      {notice && <p className="mt-3 text-xs text-[var(--quiet)]">{notice}</p>}
    </section>
  );
}
