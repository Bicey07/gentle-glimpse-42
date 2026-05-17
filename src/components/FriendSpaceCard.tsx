import { Link } from "@tanstack/react-router";
import type { Person } from "../lib/types";

type Line = { label: string; value: React.ReactNode; key: string };

export function FriendSpaceCard({ person }: { person: Person }) {
  const r = person.recent ?? {};

  // 按优先级收集真实存在的内容，最多 3 条
  const lines: Line[] = [];
  if (r.mood) lines.push({ key: "mood", label: "本周", value: r.mood });
  if (r.sentence)
    lines.push({
      key: "sentence",
      label: "写了",
      value: (
        <span className="font-serif italic text-[var(--ink)]/85">「{r.sentence}」</span>
      ),
    });
  if (r.reading)
    lines.push({ key: "reading", label: "在读", value: `《${r.reading.title}》` });
  if (r.watching)
    lines.push({ key: "watching", label: "在看", value: `《${r.watching.title}》` });
  if (r.listening)
    lines.push({
      key: "listening",
      label: "在听",
      value: r.listening.artist
        ? `${r.listening.title} · ${r.listening.artist}`
        : r.listening.title,
    });
  if (r.weekPlan)
    lines.push({ key: "plan", label: "想做", value: r.weekPlan });

  const visible = lines.slice(0, 3);
  const hasImage = Boolean(r.imageUrl);

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

      {hasImage && (
        <img
          src={r.imageUrl}
          alt="一张图"
          className="mb-3 h-24 w-full rounded-lg object-cover opacity-90"
          loading="lazy"
        />
      )}

      {visible.length === 0 ? (
        <p className="text-[12px] text-[var(--quiet)]">最近还没留下什么。</p>
      ) : (
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--ink)]/85">
          {visible.map((l) => (
            <div key={l.key} className="truncate">
              <span className="mr-2 text-[10px] tracking-widest text-[var(--quiet)]">
                {l.label}
              </span>
              {l.value}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
