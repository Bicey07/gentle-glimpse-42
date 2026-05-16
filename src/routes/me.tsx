import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { me, personEntries } from "../data/mockData";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const { books, movies, sentences, images } = personEntries(me.id);
  const r = me.recent;

  return (
    <PageShell>
      <Link to="/" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← 走廊
      </Link>

      <header className="mb-12">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">My Space</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">{me.name}的房间</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{me.bio}</p>
      </header>

      <section className="mb-12 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="grid grid-cols-1 gap-5 text-[14px]">
          <Field label="本周">{r.mood}</Field>
          {r.reading && <Field label="在读">《{r.reading.title}》 · {r.reading.author}</Field>}
          {r.watching && <Field label="在看">《{r.watching.title}》 · {r.watching.director}</Field>}
          {r.sentence && (
            <Field label="随记">
              <span className="font-serif italic text-[var(--ink)]/85">「{r.sentence}」</span>
            </Field>
          )}
        </div>
      </section>

      <section className="mb-12">
        <SectionTitle>书架</SectionTitle>
        {books.length === 0 ? (
          <EmptyHint>架子上还空着。</EmptyHint>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {books.map((b) => (
              <div key={b.id} className="w-28 shrink-0">
                <img src={b.cover} alt={b.title} className="h-36 w-28 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{b.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{b.author}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <SectionTitle>影集</SectionTitle>
        {movies.length === 0 ? (
          <EmptyHint>还没看过什么。</EmptyHint>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {movies.map((m) => (
              <div key={m.id} className="w-36 shrink-0">
                <img src={m.cover} alt={m.title} className="h-24 w-36 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{m.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{m.director}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <SectionTitle>随记</SectionTitle>
        {sentences.length === 0 ? (
          <EmptyHint>这里安静着。</EmptyHint>
        ) : (
          <div className="space-y-4">
            {sentences.map((s) => (
              <p key={s.id} className="font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90 border-l-2 border-[var(--border)] pl-4">
                {s.text}
              </p>
            ))}
          </div>
        )}
      </section>

      {images.length > 0 && (
        <section className="mb-12">
          <SectionTitle>窗外</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {images.map((i) => (
              <img key={i.id} src={i.url} alt={i.caption ?? ""} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
            ))}
          </div>
        </section>
      )}
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
