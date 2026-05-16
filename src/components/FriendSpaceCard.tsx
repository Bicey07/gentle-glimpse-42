import { Link } from "@tanstack/react-router";
import type { Person } from "../lib/types";

export function FriendSpaceCard({ person }: { person: Person }) {
  const r = person.recent;
  return (
    <Link
      to="/friend/$id"
      params={{ id: person.id }}
      className="group fade-in flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--bluegrey)]"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div className="font-serif text-[15px] text-[var(--ink)]">{person.name}</div>
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: person.color }}
          aria-hidden
        />
      </div>

      <div className="space-y-2 text-[13px] leading-relaxed text-[var(--ink)]/85">
        <div>
          <span className="text-[10px] tracking-widest text-[var(--quiet)] mr-2">本周</span>
          {r.mood}
        </div>
        {r.reading && (
          <div className="truncate">
            <span className="text-[10px] tracking-widest text-[var(--quiet)] mr-2">在读</span>
            《{r.reading.title}》
          </div>
        )}
        {r.watching && (
          <div className="truncate">
            <span className="text-[10px] tracking-widest text-[var(--quiet)] mr-2">在看</span>
            《{r.watching.title}》
          </div>
        )}
      </div>

      {r.sentence && (
        <p className="mt-4 border-t border-[var(--border)] pt-3 font-serif text-[13px] italic text-[var(--ink)]/80 leading-relaxed line-clamp-3">
          「{r.sentence}」
        </p>
      )}
    </Link>
  );
}
