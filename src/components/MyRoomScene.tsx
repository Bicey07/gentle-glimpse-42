import { useState } from "react";
import { useI18n } from "../lib/i18n";
import type { BookEntry, ImageEntry, MovieEntry, Person } from "../lib/types";

export function MyRoomScene({ person, books, movies, images }: { person: Person; books: BookEntry[]; movies: MovieEntry[]; images: ImageEntry[] }) {
  const { t: tx } = useI18n();
  const [selected, setSelected] = useState<{ title: string; meta: string; note?: string } | null>(null);
  const things = [
    ...books.slice(0, 4).map((b) => ({ id: b.id, src: b.cover, title: `《${b.title}》`, meta: b.author, note: b.note, kind: "book" })),
    ...movies.slice(0, 4).map((m) => ({ id: m.id, src: m.cover, title: `《${m.title}》`, meta: m.director, note: m.note, kind: "movie" })),
    ...images.slice(0, 4).map((i) => ({ id: i.id, src: i.url, title: i.caption || tx("一张照片"), meta: tx("生活痕迹"), note: i.caption, kind: "image" })),
  ];
  return <section className="relative mb-12 overflow-hidden rounded-[34px] border border-[var(--border)] bg-[#eee8dc] p-5 shadow-[0_18px_50px_rgba(63,54,43,.08)] sm:p-8">
    <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#d8c8b8]/60 blur-2xl" />
    <div className="relative flex items-end justify-between"><div><div className="text-[10px] tracking-[.35em] text-[var(--quiet)]">MY LITTLE HOUSE</div><h2 className="mt-2 font-serif text-3xl text-[var(--ink)]">{person.name || tx("我的小屋")}</h2><p className="mt-1 text-xs text-[var(--quiet)]">{tx("把看过的、遇见的，慢慢放在这里。")}</p></div><div className="hidden h-20 w-16 rounded-t-full border border-[#b6a796] bg-[#e3d6c7] sm:block" />}</div>
    <div className="relative mt-7 grid min-h-[265px] grid-cols-4 items-end gap-3 rounded-[26px] border border-[#c8b9a8] bg-[#f5efe6] p-4 sm:gap-5 sm:p-6">
      <div className="absolute left-5 top-5 h-20 w-24 rounded-t-full border border-[#bcae9d] bg-[#dfe1d5]/70" />
      <div className="absolute bottom-0 left-1/2 h-28 w-20 -translate-x-1/2 rounded-t-[45px] bg-[#d5c3b3]/60" />
      {things.length === 0 ? <div className="col-span-4 z-10 self-center text-center text-sm text-[var(--quiet)]">{tx("小屋还空着，从记录页放一件东西进来。")}</div> : things.map((x, i) => <button key={x.id} type="button" onClick={() => setSelected(x)} aria-label={x.title} className={`group relative z-10 w-full max-w-[116px] justify-self-center text-left transition duration-300 hover:-translate-y-2 ${i % 2 ? "rotate-2" : "-rotate-2"}`}><div className="aspect-[3/4] overflow-hidden rounded-sm border-[5px] border-[#f8f3ea] bg-[#d8cbbb] shadow-[0_8px_16px_rgba(58,45,34,.18)]"><img src={x.src} alt="" className="h-full w-full object-cover" loading="lazy" /></div><div className="mt-2 truncate font-serif text-[11px] text-[var(--ink)]">{x.title}</div><div className="truncate text-[10px] text-[var(--quiet)]">{x.meta}</div></button>)}
    </div>
    {selected && <div className="relative mt-4 rounded-2xl border border-[#c8b9a8] bg-[#f8f3ea]/80 p-4"><button type="button" onClick={() => setSelected(null)} className="float-right text-xs text-[var(--quiet)]">×</button><div className="font-serif text-base text-[var(--ink)]">{selected.title}</div><div className="mt-1 text-xs text-[var(--quiet)]">{selected.meta}</div>{selected.note && <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]/75">{selected.note}</p>}</div>}
  </section>;
}
