import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { PostCard } from "../components/PostCard";
import { mockPosts } from "../data/mockData";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const posts = [...mockPosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return (
    <PageShell>
      <header className="mb-10">
        <div className="text-xs tracking-[0.2em] text-[var(--quiet)]">QUIET · SPACE</div>
        <h1 className="mt-3 font-serif text-2xl leading-relaxed text-[var(--ink)]">
          今天，朋友们留下了一些痕迹。
        </h1>
      </header>
      <div>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        <p className="pt-12 text-center text-xs text-[var(--quiet)]">
          —— 你已经看到这里了 ——
        </p>
      </div>
    </PageShell>
  );
}
