import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "登录 · Quiet Space" },
      { name: "description", content: "用邮箱登录，开始在自己的房间里留下生活痕迹。" },
      { property: "og:title", content: "登录 · Quiet Space" },
      { property: "og:description", content: "用邮箱登录，开始在自己的房间里留下生活痕迹。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const userEmail = useStore((s) => s.email);
  const signedIn = useStore((s) => s.mode === "cloud");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: "没能进门：邮箱或密码不对，或邮箱还没确认。" });
      navigate({ to: "/me" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
      });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: `没能创建房间：${error.message}` });
      if (data.session) navigate({ to: "/me" });
      else setMsg({ kind: "ok", text: "确认邮件已经寄出，点开邮件里的链接后再回来登录。" });
    }
  };

  const input =
    "w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]";

  if (signedIn) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="font-serif text-xl text-[var(--ink)]">你已经在房间里了。</div>
          <div className="mt-2 text-xs text-[var(--quiet)]">{userEmail}</div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-8 rounded-full border border-[var(--border)] px-5 py-1.5 text-xs text-[var(--quiet)] hover:text-[var(--ink)]"
          >
            退出登录
          </button>
          <Link to="/me" className="mt-4 text-xs text-[var(--bluegrey)]">去我的房间 →</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">Sign in</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">
          {mode === "in" ? "回到自己的房间。" : "给自己一间房间。"}
        </h1>
        <p className="mt-2 text-xs text-[var(--quiet)]">不登录也可以四处看看示例房间。</p>
      </header>
      <form onSubmit={submit} className="space-y-5">
        {mode === "up" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="想被怎么称呼（可选）" maxLength={40} className={input} />
        )}
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" autoComplete="email" className={input} />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（至少 6 位）" autoComplete={mode === "in" ? "current-password" : "new-password"} className={input} />
        {msg && (
          <p role="alert" className="text-center text-xs" style={{ color: msg.kind === "ok" ? "var(--ink)" : "var(--bluegrey)" }}>
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={busy} className="w-full rounded-full border border-[var(--ink)] py-3 font-serif text-[15px] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50">
          {busy ? "稍等…" : mode === "in" ? "登录" : "注册"}
        </button>
      </form>
      <button
        onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}
        className="mt-6 block w-full text-center text-xs text-[var(--quiet)] hover:text-[var(--ink)]"
      >
        {mode === "in" ? "还没有房间？注册一个" : "已经有房间了？去登录"}
      </button>
    </PageShell>
  );
}
