import type { ReactNode } from "react";

interface WeekNotesProps {
  title?: string;
  mood?: string;
  wish?: string;          // 想做的一件事
  freeDays?: string[];    // 可能有空的日子
  traces?: string[];      // 本周已留下的痕迹（短文本）
  footer?: ReactNode;
}

/**
 * 「本周小历」——不是日历，不是任务。
 * 只是把生活的节奏轻轻摊开。
 */
export function WeekNotes({
  title = "本周小历",
  mood,
  wish,
  freeDays,
  traces,
  footer,
}: WeekNotesProps) {
  const hasAnything =
    Boolean(mood) ||
    Boolean(wish) ||
    (freeDays && freeDays.length > 0) ||
    (traces && traces.length > 0);

  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/70 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.28em] text-[var(--quiet)]">
          {title.toUpperCase()}
        </span>
        <span className="font-serif text-[12px] italic text-[var(--quiet)]">
          这一周的节奏
        </span>
      </div>

      {!hasAnything ? (
        <p className="py-4 text-center text-[12px] text-[var(--quiet)]">
          这一周还很空白，慢慢来。
        </p>
      ) : (
        <div className="space-y-4 text-[14px]">
          {mood && <Row label="状态">{mood}</Row>}
          {wish && <Row label="想做">{wish}</Row>}
          {freeDays && freeDays.length > 0 && (
            <Row label="有空">
              <span className="flex flex-wrap gap-1.5">
                {freeDays.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-[var(--border)] bg-[var(--paper)] px-2.5 py-0.5 text-[11px] text-[var(--ink)]/75"
                  >
                    {d}
                  </span>
                ))}
              </span>
            </Row>
          )}
          {traces && traces.length > 0 && (
            <Row label="留下">
              <ul className="space-y-1 text-[13px] text-[var(--ink)]/80">
                {traces.slice(0, 3).map((t, i) => (
                  <li key={i} className="truncate">
                    · {t}
                  </li>
                ))}
              </ul>
            </Row>
          )}
        </div>
      )}

      {footer && (
        <div className="mt-5 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--quiet)]">
          {footer}
        </div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-10 shrink-0 pt-0.5 text-[11px] tracking-widest text-[var(--quiet)]">
        {label}
      </span>
      <span className="flex-1 leading-relaxed text-[var(--ink)]/90">{children}</span>
    </div>
  );
}
