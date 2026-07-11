import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { SectionTitle } from "../components/SectionTitle";
import { WeekNotes } from "../components/WeekNotes";
import { findPerson } from "../data/mockData";
import { actions, useStore, personEntriesFromStore } from "../lib/store";

export const Route = createFileRoute("/friends/$id")({
  component: FriendPage,
});

function FriendPage() {
  const { id } = Route.useParams();
  const basePerson = findPerson(id);
  const livePerson = useStore((s) =>
    id === "me" ? s.me : s.friends.find((f) => f.id === id),
  );
  const person = livePerson ?? basePerson;

  const data = useStore((s) => (person ? personEntriesFromStore(s, person.id) : null));
  const replies = useStore((s) =>
    person ? s.replies.filter((r) => r.personId === person.id) : [],
  );

  const [reply, setReply] = useState("");

  if (!person || !data) {
    return (
      <PageShell>
        <p className="py-20 text-center text-sm text-[var(--quiet)]">没有找到这个房间。</p>
        <div className="text-center"><Link to="/" className="text-sm text-[var(--bluegrey)]">回走廊</Link></div>
      </PageShell>
    );
  }

  const r = person.recent;
  const publicSentences = data.sentences.filter((s) => s.visibility !== "self");

  const submitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    actions.addReply(person.id, reply);
    setReply("");
  };

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/friends" className="text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
          ← 朋友们
        </Link>
        <span className="text-[10px] tracking-widest text-[var(--quiet)]">Friend Space</span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: person.color }} />
          <span>{person.name}</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">{person.name}的房间</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{person.bio}</p>
      </header>

      {/* 本周摘要 */}
      <section className="mb-6 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="grid grid-cols-1 gap-4 text-[14px]">
          {r.mood && <Field label="本周">{r.mood}</Field>}
          {r.reading && <Field label="在读">《{r.reading.title}》 · {r.reading.author}</Field>}
          {r.watching && <Field label="在看">《{r.watching.title}》 · {r.watching.director}</Field>}
          {r.listening && (
            <Field label="在听">
              {r.listening.title}
              {r.listening.artist && <span className="text-[var(--quiet)]"> · {r.listening.artist}</span>}
            </Field>
          )}
          {r.sentence && (
            <Field label="随记">
              <span className="font-serif italic text-[var(--ink)]/85">「{r.sentence}」</span>
            </Field>
          )}
          {!r.mood && !r.reading && !r.watching && !r.listening && !r.sentence && (
            <p className="text-[12px] text-[var(--quiet)]">TA 最近还没留下什么。</p>
          )}
        </div>
      </section>

      {/* Ta 的这一周 */}
      <section className="mb-10">
        <SectionTitle>Ta 的这一周</SectionTitle>
        <WeekNotes
          title="这一周"
          mood={r.mood}
          wish={r.weekPlan}
          freeDays={r.freeDays}
          footer={
            r.freeDays && r.freeDays.length > 0
              ? "TA 愿意被看到的空闲时间。"
              : "只是一点节奏，不是邀约。"
          }
        />
      </section>

      {data.books.length > 0 && (
        <section className="mb-10">
          <SectionTitle>书架</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.books.map((b) => (
              <div key={b.id} className="w-28 shrink-0">
                <img src={b.cover} alt={b.title} className="h-36 w-28 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{b.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{b.author}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.movies.length > 0 && (
        <section className="mb-10">
          <SectionTitle>影集</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.movies.map((m) => (
              <div key={m.id} className="w-36 shrink-0">
                <img src={m.cover} alt={m.title} className="h-24 w-36 rounded-md object-cover" loading="lazy" />
                <div className="mt-2 font-serif text-[13px] text-[var(--ink)] truncate">《{m.title}》</div>
                <div className="text-[11px] text-[var(--quiet)] truncate">{m.director}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {publicSentences.length > 0 && (
        <section className="mb-10">
          <SectionTitle>随记</SectionTitle>
          <div className="space-y-4">
            {publicSentences.map((s) => (
              <p key={s.id} className="font-serif text-[16px] leading-[1.9] text-[var(--ink)]/90 border-l-2 border-[var(--border)] pl-4">
                {s.text}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 轻回应 */}
      <section className="mt-14">
        <SectionTitle>留一句</SectionTitle>
        <form onSubmit={submitReply} className="space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="留一句话，给 TA"
            rows={2}
            className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 font-serif text-[15px] leading-relaxed outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--quiet)]">只有 TA 看得到</span>
            <button
              type="submit"
              className="rounded-full border border-[var(--ink)] px-5 py-1.5 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              轻轻送出
            </button>
          </div>
        </form>

        {replies.length > 0 && (
          <ul className="mt-6 space-y-2">
            {replies.map((rp) => (
              <li
                key={rp.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 px-4 py-2 text-[13px] text-[var(--ink)]/80"
              >
                <span className="text-[10px] tracking-widest text-[var(--quiet)] mr-2">你</span>
                {rp.text}
              </li>
            ))}
          </ul>
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
