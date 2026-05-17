import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/me")({
  component: MePage,
});

const fallbackMe = {
  name: "你",
  bio: "在城里慢慢生活。",
  recent: {
    mood: "还没有更新",
    reading: undefined as { title: string; author: string } | undefined,
    watching: undefined as { title: string; director: string } | undefined,
    sentence: undefined as string | undefined,
  },
};

function MePage() {
  const me = useStore((s) => s.me);
  const allTraces = useStore((s) => s.traces);
  const allBooks = useStore((s) => s.books);
  const allMovies = useStore((s) => s.movies);
  const allImages = useStore((s) => s.images);
  const allSentences = useStore((s) => s.sentences);

  const person = me ?? fallbackMe;
  const recent = person.recent ?? fallbackMe.recent;

  const traces = useMemo(
    () => safeArray(allTraces).filter((t) => t?.personId === "me").slice(0, 6),
    [allTraces],
  );
  const bookshelf = useMemo(
    () => safeArray(allBooks).filter((b) => b?.personId === "me"),
    [allBooks],
  );
  const films = useMemo(
    () => safeArray(allMovies).filter((m) => m?.personId === "me"),
    [allMovies],
  );
  const images = useMemo(
    () => safeArray(allImages).filter((i) => i?.personId === "me"),
    [allImages],
  );
  const privateNotes = useMemo(
    () => safeArray(allSentences).filter((s) => s?.personId === "me" && s?.visibility === "self"),
    [allSentences],
  );
  const sharedNotes = useMemo(
    () => safeArray(allSentences).filter((s) => s?.personId === "me" && s?.visibility !== "self"),
    [allSentences],
  );

  return (
    <PageShell>
      <Link to="/" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← 走廊
      </Link>

      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">My Space</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">你的房间</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{person.bio || "这里可以慢慢放下生活的痕迹。"}</p>
      </header>

      <section className="mb-10 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] tracking-widest text-[var(--quiet)]">本周</span>
          <Link
            to="/add"
            search={{ type: "status" }}
            className="text-[11px] text-[var(--bluegrey)] hover:text-[var(--ink)]"
          >
            更新状态 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 text-[14px]">
          <Field label="心情">{recent.mood || "还没有写下本周状态"}</Field>
          <Field label="在读">
            {recent.reading ? `《${recent.reading.title}》 · ${recent.reading.author}` : "还没有放入书架"}
          </Field>
          <Field label="在看">
            {recent.watching ? `《${recent.watching.title}》 · ${recent.watching.director}` : "还没有记录影像"}
          </Field>
          <Field label="随记">
            {recent.sentence ? (
              <span className="font-serif italic text-[var(--ink)]/85">「{recent.sentence}」</span>
            ) : (
              "今天也可以什么都不写"
            )}
          </Field>
        </div>
      </section>

      <section className="mb-12">
        <SectionTitle
          aside={
            <Link to="/add" className="hover:text-[var(--ink)]">
              留一点 →
            </Link>
          }
        >
          最近痕迹
        </SectionTitle>
        {traces.length === 0 ? (
          <EmptyHint>这里还没有新的痕迹。</EmptyHint>
        ) : (
          <ul className="space-y-2 text-[13px] text-[var(--ink)]/80">
            {traces.map((t) => (
              <li key={t.id} className="flex gap-3 border-b border-[var(--border)] py-2">
                <span className="text-[var(--quiet)]">·</span>
                <span>
                  {t.verb || "留下了一点生活痕迹"}
                  {t.detail && <span className="text-[var(--quiet)]">  {t.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <SectionTitle>书架</SectionTitle>
        {bookshelf.length === 0 ? (
          <EmptyHint>架子上还空着。</EmptyHint>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {bookshelf.map((b) => (
              <div key={b.id} className="w-28 shrink-0">
                <img src={b.cover} alt={b.title || "书"} className="h-36 w-28 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 truncate font-serif text-[13px] text-[var(--ink)]">《{b.title || "未命名"}》</div>
                <div className="truncate text-[11px] text-[var(--quiet)]">{b.author || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <SectionTitle>影像</SectionTitle>
        {films.length === 0 && images.length === 0 ? (
          <EmptyHint>还没有记录影像。</EmptyHint>
        ) : (
          <div className="space-y-5">
            {films.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {films.map((m) => (
                  <div key={m.id} className="w-36 shrink-0">
                    <img src={m.cover} alt={m.title || "电影"} className="h-24 w-36 rounded-md object-cover" loading="lazy" />
                    <div className="mt-2 truncate font-serif text-[13px] text-[var(--ink)]">《{m.title || "未命名"}》</div>
                    <div className="truncate text-[11px] text-[var(--quiet)]">{m.director || "—"}</div>
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((i) => (
                  <img
                    key={i.id}
                    src={i.url}
                    alt={i.caption || "生活照片"}
                    className="aspect-square w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mb-12">
        <SectionTitle aside={<span>Friends 可见</span>}>随记</SectionTitle>
        {sharedNotes.length === 0 ? (
          <EmptyHint>还没有写下什么。</EmptyHint>
        ) : (
          <div className="space-y-4">
            {sharedNotes.map((s) => (
              <p key={s.id} className="border-l-2 border-[var(--border)] pl-4 font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90">
                {s.text || "一点安静的记录。"}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <SectionTitle aside={<span>Only me</span>}>私密随记</SectionTitle>
        {privateNotes.length === 0 ? (
          <EmptyHint>这里留给你自己。</EmptyHint>
        ) : (
          <div className="space-y-4">
            {privateNotes.map((s) => (
              <p
                key={s.id}
                className="border-l-2 pl-4 font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90"
                style={{ borderColor: "color-mix(in oklab, var(--sage) 40%, var(--paper))" }}
              >
                {s.text || "一点只给自己的记录。"}
              </p>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-10 shrink-0 pt-0.5 text-[11px] tracking-widest text-[var(--quiet)]">{label}</span>
      <span className="flex-1 leading-relaxed text-[var(--ink)]/90">{children}</span>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-xs text-[var(--quiet)]">{children}</p>;
}