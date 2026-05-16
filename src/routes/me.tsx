import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { useStore, personEntriesFromStore } from "../lib/store";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const me = useStore((s) => s.me);
  const data = useStore((s) => personEntriesFromStore(s, "me"));
  const traces = useStore((s) =>
    s.traces.filter((t) => t.personId === "me").slice(0, 6),
  );
  const r = me.recent;

  const publicSentences = data.sentences.filter((s) => s.visibility !== "self");
  const privateSentences = data.sentences.filter((s) => s.visibility === "self");

  return (
    <PageShell>
      <Link to="/" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← 走廊
      </Link>

      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">My Space</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">{me.name}的房间</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{me.bio}</p>
      </header>

      {/* 本周状态 */}
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
          <Field label="心情">{r.mood}</Field>
          {r.reading && <Field label="在读">《{r.reading.title}》 · {r.reading.author}</Field>}
          {r.watching && <Field label="在看">《{r.watching.title}》 · {r.watching.director}</Field>}
          {r.sentence && (
            <Field label="随记">
              <span className="font-serif italic text-[var(--ink)]/85">「{r.sentence}」</span>
            </Field>
          )}
        </div>
      </section>

      {/* 最近留下的痕迹 */}
      <section className="mb-12">
        <SectionTitle
          aside={
            <Link to="/add" className="hover:text-[var(--ink)]">
              留一点 →
            </Link>
          }
        >
          最近留下
        </SectionTitle>
        {traces.length === 0 ? (
          <EmptyHint>这周还很安静。</EmptyHint>
        ) : (
          <ul className="space-y-2 text-[13px] text-[var(--ink)]/80">
            {traces.map((t) => (
              <li key={t.id} className="flex gap-3 border-b border-[var(--border)] py-2">
                <span className="text-[var(--quiet)]">·</span>
                <span>
                  {t.verb}
                  {t.detail && <span className="text-[var(--quiet)]">  {t.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 书架 */}
      <section className="mb-12">
        <SectionTitle>书架</SectionTitle>
        {data.books.length === 0 ? (
          <EmptyHint>架子上还空着。</EmptyHint>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.books.map((b) => (
              <div key={b.id} className="w-28 shrink-0">
                <img src={b.cover} alt={b.title} className="h-36 w-28 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{b.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{b.author}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 影像 */}
      <section className="mb-12">
        <SectionTitle>影像</SectionTitle>
        {data.movies.length === 0 && data.images.length === 0 ? (
          <EmptyHint>还没看过什么。</EmptyHint>
        ) : (
          <div className="space-y-5">
            {data.movies.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {data.movies.map((m) => (
                  <div key={m.id} className="w-36 shrink-0">
                    <img src={m.cover} alt={m.title} className="h-24 w-36 rounded-md object-cover" loading="lazy" />
                    <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{m.title}》</div>
                    <div className="text-[11px] text-[var(--quiet)] truncate">{m.director}</div>
                  </div>
                ))}
              </div>
            )}
            {data.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {data.images.map((i) => (
                  <img
                    key={i.id}
                    src={i.url}
                    alt={i.caption ?? ""}
                    className="aspect-square w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 公开随记 */}
      <section className="mb-12">
        <SectionTitle aside={<span>Friends 可见</span>}>随记</SectionTitle>
        {publicSentences.length === 0 ? (
          <EmptyHint>还没有写下什么。</EmptyHint>
        ) : (
          <div className="space-y-4">
            {publicSentences.map((s) => (
              <p key={s.id} className="font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90 border-l-2 border-[var(--border)] pl-4">
                {s.text}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* 私密随记 */}
      <section className="mb-12">
        <SectionTitle aside={<span>Only me</span>}>私密随记</SectionTitle>
        {privateSentences.length === 0 ? (
          <EmptyHint>这里留给你自己。</EmptyHint>
        ) : (
          <div className="space-y-4">
            {privateSentences.map((s) => (
              <p
                key={s.id}
                className="font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90 border-l-2 pl-4"
                style={{ borderColor: "color-mix(in oklab, var(--sage) 40%, var(--paper))" }}
              >
                {s.text}
              </p>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-10 shrink-0 text-[11px] tracking-widest text-[var(--quiet)] pt-0.5">{label}</span>
      <span className="flex-1 text-[var(--ink)]/90 leading-relaxed">{children}</span>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-xs text-[var(--quiet)]">{children}</p>;
}
