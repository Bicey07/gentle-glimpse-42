import { useState } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { actions, useStore, type ActionResult, type Visibility } from "../lib/store";

type PostType = "sentence" | "image" | "book" | "movie" | "status";

export const Route = createFileRoute("/add")({
  validateSearch: (s: Record<string, unknown>): { type?: PostType } => ({
    type: (s.type as PostType) || undefined,
  }),
  component: AddPage,
});

const types: { value: PostType; label: string }[] = [
  { value: "sentence", label: "一句话" },
  { value: "image", label: "一张图" },
  { value: "book", label: "一本书" },
  { value: "movie", label: "一部电影" },
  { value: "status", label: "本周状态" },
];

const moods = ["平静", "想念", "在恢复", "缓慢", "有点累", "明亮"];

function AddPage() {
  const search = useSearch({ from: "/add" });
  const [type, setType] = useState<PostType>(search.type ?? "sentence");
  const [sent, setSent] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const mode = useStore((s) => s.mode);
  const navigate = useNavigate();

  // form state
  const [text, setText] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgCap, setImgCap] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookNote, setBookNote] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [movieDir, setMovieDir] = useState("");
  const [movieNote, setMovieNote] = useState("");
  const [mood, setMood] = useState("平静");
  const [moodExtra, setMoodExtra] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNeedLogin(false);
    setBusy(true);
    let res: ActionResult;
    if (type === "sentence") res = await actions.addSentence(text, visibility);
    else if (type === "image") res = await actions.addImage(imgFile, imgCap || undefined, visibility);
    else if (type === "book") res = await actions.addBook(bookTitle, bookAuthor, bookNote || undefined, visibility);
    else if (type === "movie") res = await actions.addMovie(movieTitle, movieDir, movieNote || undefined, visibility);
    else res = await actions.updateMood(mood, moodExtra);
    setBusy(false);
    if (!res.ok) {
      setError(res.reason === "auth" ? res.message : `没能放进去：${res.message}`);
      setNeedLogin(res.reason === "auth");
      return;
    }
    setSent(true);
    setTimeout(() => navigate({ to: "/me" }), 1300);
  };

  if (sent) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="font-serif text-xl text-[var(--ink)]">已经放进你的房间。</div>
          <div className="mt-3 text-sm text-[var(--quiet)]">
            {visibility === "self" ? "只有你能看到。" : "朋友走进来时会看到。"}
          </div>
          <Link to="/me" className="mt-8 text-xs text-[var(--bluegrey)] hover:text-[var(--ink)]">
            去看看我的房间 →
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">Add</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">在自己的房间里留下一点痕迹。</h1>
        <p className="mt-2 text-xs text-[var(--quiet)]">不用写得很认真，几个字也可以。</p>
      </header>

      <div className="-mx-1 mb-8 flex flex-wrap gap-2">
        {types.map((t) => {
          const active = t.value === type;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className="rounded-full border px-4 py-1.5 text-sm transition-colors"
              style={{
                borderColor: active ? "var(--ink)" : "var(--border)",
                backgroundColor: active ? "var(--ink)" : "transparent",
                color: active ? "var(--paper)" : "var(--quiet)",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-6">
        {type === "sentence" && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写一句给自己的话…"
            rows={5}
            className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 font-serif text-[17px] leading-relaxed outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
          />
        )}

        {type === "image" && (
          <div className="space-y-3">
            <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 p-5 text-center text-sm text-[var(--quiet)]">
              <span>{imgFile ? imgFile.name : "选择一张生活照片"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImgFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            <input
              value={imgCap}
              onChange={(e) => setImgCap(e.target.value)}
              placeholder="给它一行说明（可选）"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type === "book" && (
          <div className="space-y-4">
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="书名"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <input
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              placeholder="作者"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <textarea
              value={bookNote}
              onChange={(e) => setBookNote(e.target.value)}
              placeholder="一句感受（可选）"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-[15px] outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type === "movie" && (
          <div className="space-y-4">
            <input
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              placeholder="片名"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <input
              value={movieDir}
              onChange={(e) => setMovieDir(e.target.value)}
              placeholder="导演"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <textarea
              value={movieNote}
              onChange={(e) => setMovieNote(e.target.value)}
              placeholder="一句感受（可选）"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-[15px] outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type === "status" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => {
                const active = m === mood;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className="rounded-full border px-4 py-1.5 text-sm transition-colors"
                    style={{
                      borderColor: active ? "var(--ink)" : "var(--border)",
                      color: active ? "var(--ink)" : "var(--quiet)",
                      backgroundColor: active
                        ? "color-mix(in oklab, var(--sage) 35%, var(--paper))"
                        : "transparent",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <input
              value={moodExtra}
              onChange={(e) => setMoodExtra(e.target.value)}
              placeholder="想多说一句吗（可选）"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type !== "status" && (
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 px-4 py-3">
            <span className="text-[11px] tracking-widest text-[var(--quiet)]">谁能看见</span>
            <div className="flex gap-1">
              {(
                [
                  { v: "self", label: "Only me" },
                  { v: "friends", label: "Friends" },
                ] as const
              ).map((o) => {
                const active = visibility === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setVisibility(o.v)}
                    className="rounded-full px-3 py-1 text-xs transition-colors"
                    style={{
                      backgroundColor: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--paper)" : "var(--quiet)",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4">
          {error && (
            <p role="alert" className="mb-3 text-center text-xs text-[var(--bluegrey)]">
              {error}
              {needLogin && (
                <Link to="/auth" className="ml-2 underline underline-offset-4 hover:text-[var(--ink)]">
                  去登录 →
                </Link>
              )}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full border border-[var(--ink)] bg-transparent py-3 font-serif text-[15px] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50"
          >
            {busy ? "正在放进房间…" : "放进我的房间"}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--quiet)]">
            {mode === "demo" ? "你正在看示例房间，登录后才能留下自己的痕迹。" : "没有标签、没有定时、没有提醒。"}
          </p>
        </div>
      </form>
    </PageShell>
  );
}
