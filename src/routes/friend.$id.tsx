import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { findPerson, personEntries } from "../data/mockData";

export const Route = createFileRoute("/friend/$id")({
  component: FriendPage,
});

function FriendPage() {
  const { id } = Route.useParams();
  const person = findPerson(id);

  if (!person) {
    return (
      <PageShell>
        <p className="py-20 text-center text-sm text-[var(--quiet)]">没有找到这个房间。</p>
        <div className="text-center"><Link to="/" className="text-sm text-[var(--bluegrey)]">回走廊</Link></div>
      </PageShell>
    );
  }

  const { books, movies, sentences } = personEntries(person.id);
  const r = person.recent;

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/friends" className="text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
          ← 朋友们
        </Link>
        <button className="text-xs text-[var(--bluegrey)] hover:text-[var(--ink)]">
          轻轻打个招呼
        </button>
      </div>

      <header className="mb-12">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          <span>Friend Space</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: person.color }} />
        </div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">{person.name}的房间</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{person.bio}</p>
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

      {books.length > 0 && (
        <section className="mb-12">
          <SectionTitle>书架</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {books.map((b) => (
              <div key={b.id} className="w-28 shrink-0">
                <img src={b.cover} alt={b.title} className="h-36 w-28 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{b.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{b.author}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {movies.length > 0 && (
        <section className="mb-12">
          <SectionTitle>影集</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {movies.map((m) => (
              <div key={m.id} className="w-36 shrink-0">
                <img src={m.cover} alt={m.title} className="h-24 w-36 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{m.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{m.director}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sentences.length > 0 && (
        <section className="mb-12">
          <SectionTitle>随记</SectionTitle>
          <div className="space-y-4">
            {sentences.map((s) => (
              <p key={s.id} className="font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90 border-l-2 border-[var(--border)] pl-4">
                {s.text}
              </p>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 flex items-center justify-center gap-3 text-xs text-[var(--quiet)]">
        <span>保持联系</span>
        <span className="relative inline-block h-4 w-7 rounded-full bg-[var(--sage)]/60">
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-[var(--paper)]" />
        </span>
      </div>
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
