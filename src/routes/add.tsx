import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import type { PostType } from "../lib/types";

export const Route = createFileRoute("/add")({
  component: AddPage,
});

const types: { value: PostType; label: string }[] = [
  { value: "sentence", label: "一句话" },
  { value: "image", label: "一张图" },
  { value: "book", label: "一本书" },
  { value: "movie", label: "一部电影" },
  { value: "status", label: "本周状态" },
];

function AddPage() {
  const [type, setType] = useState<PostType>("sentence");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => navigate({ to: "/" }), 1200);
  };

  if (sent) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="font-serif text-xl text-[var(--ink)]">已经留下。</div>
          <div className="mt-3 text-sm text-[var(--quiet)]">不必被很多人看见。</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="mb-8">
        <div className="text-xs tracking-[0.2em] text-[var(--quiet)]">ADD</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">
          今天想留下什么？
        </h1>
      </header>

      <div className="-mx-1 mb-8 flex flex-wrap gap-2">
        {types.map((t) => {
          const active = t.value === type;
          return (
            <button
              key={t.value}
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
            placeholder="写一句给自己的话…"
            rows={5}
            className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 font-serif text-[17px] leading-relaxed outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
          />
        )}

        {type === "image" && (
          <div className="space-y-3">
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--quiet)]">
              点击选一张图
            </div>
            <input
              placeholder="给它一行说明（可选）"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type === "book" && (
          <div className="space-y-4">
            <input
              placeholder="书名"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <input
              placeholder="作者"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <textarea
              placeholder="一句感受（可选）"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-[15px] outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type === "movie" && (
          <div className="space-y-4">
            <input
              placeholder="片名"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <input
              placeholder="导演"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
            <textarea
              placeholder="一句感受（可选）"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-[15px] outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        {type === "status" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["平静", "想念", "在恢复", "缓慢", "有点累", "明亮"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--ink)] hover:border-[var(--bluegrey)]"
                  style={{ backgroundColor: "color-mix(in oklab, var(--sage) 25%, var(--paper))" }}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              placeholder="想多说一句吗（可选）"
              className="w-full border-b border-[var(--border)] bg-transparent py-2 outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
            />
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            className="w-full rounded-full border border-[var(--ink)] bg-transparent py-3 font-serif text-[15px] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            留下
          </button>
          <p className="mt-3 text-center text-xs text-[var(--quiet)]">
            没有标签、没有定时、没有提醒。
          </p>
        </div>
      </form>
    </PageShell>
  );
}
