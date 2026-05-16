import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { PostCard } from "../components/PostCard";
import { Avatar } from "../components/Avatar";
import { findPerson, mockPosts } from "../data/mockData";

export const Route = createFileRoute("/friend/$id")({
  component: FriendPage,
});

function FriendPage() {
  const { id } = Route.useParams();
  const person = findPerson(id);

  if (!person) {
    return (
      <PageShell>
        <p className="py-20 text-center text-sm text-[var(--quiet)]">没有找到这位朋友。</p>
        <div className="text-center">
          <Link to="/" className="text-sm text-[var(--bluegrey)]">回家</Link>
        </div>
      </PageShell>
    );
  }

  const posts = mockPosts
    .filter((p) => p.authorId === person.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const status = posts.find((p) => p.type === "status");

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-[var(--quiet)] hover:text-[var(--ink)]">
          ← 回家
        </Link>
        <button className="text-xs text-[var(--bluegrey)] hover:text-[var(--ink)]">
          轻轻打个招呼
        </button>
      </div>

      <header className="mb-10 flex flex-col items-center text-center">
        <Avatar person={person} size={72} />
        <h1 className="mt-4 font-serif text-2xl text-[var(--ink)]">{person.name}</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{person.bio}</p>
      </header>

      {status && status.type === "status" && (
        <section className="mb-10">
          <div className="mb-3 text-xs tracking-[0.2em] text-[var(--quiet)]">本周状态</div>
          <div
            className="rounded-2xl px-5 py-6"
            style={{ backgroundColor: "color-mix(in oklab, var(--sage) 35%, var(--paper))" }}
          >
            <div className="font-serif text-2xl text-[var(--ink)]">{status.mood}</div>
            {status.note && (
              <p className="mt-2 text-sm text-[var(--ink)]/80">{status.note}</p>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-1 text-xs tracking-[0.2em] text-[var(--quiet)]">最近的痕迹</div>
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--quiet)]">最近安静着。</p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} compact />)
        )}
      </section>

      <div className="mt-12 flex items-center justify-center gap-3 text-xs text-[var(--quiet)]">
        <span>保持联系</span>
        <span className="inline-block h-4 w-7 rounded-full bg-[var(--sage)]/60 relative">
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-[var(--paper)]" />
        </span>
      </div>
    </PageShell>
  );
}
