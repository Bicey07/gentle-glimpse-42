import { Link } from "@tanstack/react-router";
import type { Person } from "../lib/types";

export function MySpaceCard({ person }: { person: Person }) {
  const r = person.recent;
  return (
    <Link
      to="/me"
      className="group fade-in block rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-7 transition-colors hover:border-[var(--bluegrey)]"
    >
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="font-serif text-lg text-[var(--ink)]">{person.name}的房间</div>
          <div className="mt-1 text-xs text-[var(--quiet)]">{person.bio}</div>
        </div>
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: person.color }}
          aria-hidden
        />
      </div>

      <dl className="space-y-3 text-[14px]">
        <Row label="本周">{r.mood}</Row>
        {r.reading && (
          <Row label="在读">
            《{r.reading.title}》<span className="text-[var(--quiet)]"> · {r.reading.author}</span>
          </Row>
        )}
        {r.watching && (
          <Row label="在看">
            《{r.watching.title}》<span className="text-[var(--quiet)]"> · {r.watching.director}</span>
          </Row>
        )}
        {r.sentence && (
          <Row label="随记">
            <span className="font-serif italic text-[var(--ink)]/85">「{r.sentence}」</span>
          </Row>
        )}
      </dl>

      <div className="mt-7 flex justify-end text-xs text-[var(--quiet)] group-hover:text-[var(--ink)]">
        进入房间 →
      </div>
    </Link>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-10 shrink-0 text-[11px] tracking-widest text-[var(--quiet)] pt-0.5">{label}</dt>
      <dd className="flex-1 text-[var(--ink)]/90 leading-relaxed">{children}</dd>
    </div>
  );
}
