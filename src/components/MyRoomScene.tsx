import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "../lib/i18n";
import type { BookEntry, ImageEntry, MovieEntry, Person } from "../lib/types";

type Spot = "窗边" | "书架" | "小银幕" | "唱片机" | "桌上便签";
export function MyRoomScene({ person, books, movies, images }: { person: Person; books: BookEntry[]; movies: MovieEntry[]; images: ImageEntry[] }) {
  const { t: tx } = useI18n();
  const [spot, setSpot] = useState<Spot>("窗边");
  const [selected, setSelected] = useState<{ title: string; note?: string } | null>(null);
  const [bookPage, setBookPage] = useState(0);
  const [movieId, setMovieId] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(books.length / 8));
  const currentPage = Math.min(bookPage, pageCount - 1);
  const shelfBooks = books.slice(currentPage * 8, currentPage * 8 + 8);
  const wallMovie = movies.find(movie => movie.id === movieId) ?? movies[0];
  const showBook = (book: BookEntry) => { setSpot("书架"); setSelected(book); };
  const showMovie = (movie: MovieEntry) => { setSpot("小银幕"); setMovieId(movie.id); setSelected(movie); };
  const recent = person.recent;
  const details: Record<Spot, string> = {
    窗边: recent?.mood || tx("窗外有远山，屋里有一盏温柔的灯。"),
    书架: books[0]?.title || recent?.reading?.title || tx("书架已经安好，等你放进第一本喜欢的书。"),
    小银幕: wallMovie?.title || recent?.watching?.title || tx("留一面银幕，给下次想看的电影。"),
    唱片机: recent?.listening?.title || tx("唱片机静静等着你喜欢的声音。"),
    桌上便签: recent?.sentence || recent?.weekPlan || tx("今天想留下什么？几个字也可以。"),
  };
  const things = spot === "书架" ? books.map(b => ({ id:b.id, src:b.cover, title:b.title, note:b.note })) : spot === "小银幕" ? movies.map(m => ({ id:m.id, src:m.cover, title:m.title, note:m.note })) : spot === "窗边" ? images.map(i => ({ id:i.id, src:i.url, title:i.caption || tx("一张照片"), note:i.caption })) : [];
  return <section className="painted-room" aria-label={tx("我的小屋")}>
    <div className="painted-room__heading"><div><p className="text-[9px] tracking-[.3em] text-[var(--quiet)]">A ROOM OF ONE’S OWN</p><h2 className="mt-2 font-serif text-xl">{tx("我的小屋")} · 春水</h2></div><span className="text-xs text-[var(--quiet)]">{tx("点一点房间里的物件")}</span></div>
    <div className="painted-room__scene">
      <svg viewBox="0 0 800 520" role="img" aria-label="浅粉墙面、浅蓝月窗、远山、木书架、软榻、茶桌、唱片机与记忆柜组成的中式小屋">
        <defs>
          <linearGradient id="room-wall" x2="0" y2="1"><stop stopColor="#fff4f2"/><stop offset="1" stopColor="#f2dce7"/></linearGradient>
          <linearGradient id="room-sky" x2="0" y2="1"><stop stopColor="#cee4f5"/><stop offset="1" stopColor="#fce8ed"/></linearGradient>
          <pattern id="room-paper" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 3h4m8 9h4" stroke="#af91aa" strokeOpacity=".07"/></pattern>
          <clipPath id="room-moon"><circle cx="325" cy="170" r="112"/></clipPath>
        </defs>
        <path d="M0 0H800V365H0Z" fill="url(#room-wall)"/>
        <path d="M0 365H800V520H0Z" fill="#e9dce4"/>
        <g stroke="#b59da9" strokeWidth="1" opacity=".55"><path d="M0 402H800M0 452H800M0 510H800M100 365L0 520M280 365L230 520M460 365L485 520M640 365L765 520"/></g>
        <path d="M18 0V365H782V0M18 27H782" fill="none" stroke="#ba9a9e" strokeWidth="9"/>
        <path d="M27 0V365M773 0V365M20 38H780" stroke="#efd3ca" strokeWidth="3"/>
        <circle cx="325" cy="170" r="119" fill="#f8f0e9" stroke="#b59aa5" strokeWidth="3"/>
        <g clipPath="url(#room-moon)"><path d="M208 55H442V288H208Z" fill="url(#room-sky)"/><circle cx="357" cy="112" r="27" fill="#fff7ed"/><path d="M190 237Q243 129 284 207Q334 108 377 202Q407 174 465 240V296H190Z" fill="#aec8df"/><path d="M185 268Q259 186 304 254Q367 194 447 256V290H185Z" fill="#c4d9e7"/><path d="M205 262Q302 245 448 272M208 280Q325 260 444 282" fill="none" stroke="#fcf2ed" strokeWidth="3"/><path d="M260 50V290M391 50V290M205 175H445" stroke="#bca4b2" strokeWidth="3"/></g>
        <path d="M182 41Q213 107 179 265L143 277Q168 156 145 41ZM466 41Q444 142 472 265L506 277Q480 143 511 41Z" fill="#d7e5f3" stroke="#a8b5ce"/>
        <path d="M155 49Q182 158 155 259M173 48Q198 150 173 250M491 49Q468 147 491 258" fill="none" stroke="#b7c8db"/>
        <g stroke="#a48b98" strokeWidth="2" fill="#e8c6be"><path d="M60 175H151V372H60Z"/><path d="M65 182H146V366H65Z" fill="#f8e8e5"/><path d="M60 231H151M60 292H151M60 351H151"/><path d="M67 368V382M144 368V382"/></g>

        <g fill="#efc4b6" stroke="#b497a1"><path d="M96 310Q82 343 111 343Q134 342 119 310Z"/><path d="M99 308h18v6H99Z"/></g>
        <g stroke="#97a9b4" fill="none"><path d="M109 309Q107 285 123 280M109 302Q88 290 85 285"/><path d="M123 280q-14-8-12 7q12 5 12-7M85 285q14-10 14 5q-10 5-14-5" fill="#c8dce0"/></g>
        <g stroke="#b49ba6" strokeWidth="2"><path d="M553 100H713V224H553Z" fill="#edcbbf"/><path d="M563 110H703V214H563Z" fill="#e3edf6"/><path d="M549 95H717M549 229H717"/></g>
        <g stroke="#b499a7" strokeWidth="2"><path d="M214 290H450V380H214Z" fill="#c4d7e8"/><path d="M204 327Q330 312 461 327V367H204Z" fill="#dce9f6"/><path d="M211 371V388M450 371V388"/><path d="M226 291Q242 267 285 282L291 320H225Z" fill="#f4d8e3"/><path d="M368 290Q405 274 430 288L437 319H362Z" fill="#eec8be"/><path d="M293 319L314 369H412L397 318Z" fill="#f3dfec"/><path d="M307 328l13 30m2-31 12 31m2-31 11 31m3-31 10 31m3-31 10 31" stroke="#d1b4ca" strokeWidth="1"/></g>
        <ellipse cx="363" cy="434" rx="168" ry="54" fill="#d3e3f2" stroke="#b6c7d9"/><ellipse cx="363" cy="434" rx="155" ry="45" fill="none" stroke="#f6f3f7" strokeWidth="2"/>
        <g stroke="#b299a5" strokeWidth="2"><path d="M291 402V451M432 400V445"/><path d="M275 387Q354 362 450 383L445 411Q355 427 278 410Z" fill="#efcdc2"/><path d="M275 387Q357 408 450 383" fill="none"/><ellipse cx="345" cy="386" rx="27" ry="11" fill="#fcf2ec"/><path d="M332 381q-3-28 18-27q21 0 17 27Z" fill="#cadce8"/><path d="M363 359q22-2 14 14h-12M331 363l-14-5 12 14M335 353h19" fill="none"/><path d="M392 381l23 2-4 13-25-3Z" fill="#fff6eb"/><path d="M392 386l16 2m-17 2 11 1" strokeWidth="1"/></g>
        <path d="M227 435Q260 418 286 442L278 464Q242 473 224 453Z" fill="#f1cbd6" stroke="#baa2b2"/><path d="M447 431Q478 419 501 437L496 457Q464 467 443 448Z" fill="#f4d0c4" stroke="#baa2b2"/>
        <g stroke="#b49ca7" strokeWidth="2"><path d="M563 296H731V402H563Z" fill="#d2e0ee"/><path d="M572 308H722V349H572Zm0 48H722V390H572Z" fill="#f4e5e9"/><path d="M565 404V417M728 404V417M557 290H737V302H557Z" fill="#e7c6bf"/><path d="M645 310V388"/><circle cx="635" cy="328" r="2"/><circle cx="656" cy="328" r="2"/></g>
        <g stroke="#9e94a6"><path d="M590 254H697V285H590Z" fill="#efc6bb"/><ellipse cx="629" cy="268" rx="26" ry="10" fill="#73869c"/><ellipse cx="629" cy="268" rx="15" ry="6" fill="none" stroke="#c6dce9"/><ellipse cx="629" cy="268" rx="5" ry="2" fill="#f3d5d9"/><path d="M683 259L675 275H664" strokeWidth="3" fill="none"/></g>
        <g stroke="#ac93a3" fill="#f6d6cf"><path d="M520 37V65M506 66Q520 57 534 66L540 108Q520 118 500 108Z"/><path d="M520 112V145l-8 25 15 4-7-29M507 74h27M503 100h34" fill="none"/></g>
        <path d="M0 0H800V520H0Z" fill="url(#room-paper)" pointerEvents="none"/>
      </svg>
      {shelfBooks.map((book, index) => {
        const colors = ["#cadcea", "#ecc4cf", "#f2d3bf", "#d4cce4"];
        return <button key={book.id} type="button" className="room-book-spine"
          style={{ left:`${(73 + (index % 4) * 17) / 8}%`, top:`${(183 + Math.floor(index / 4) * 61) / 5.2}%`, width:"1.75%", height:"9.04%", backgroundColor:colors[index % colors.length] }}
          aria-label={`${tx("书架")}：《${book.title}》`} title={book.title} onClick={() => showBook(book)}>
          <span>{book.title}</span>
        </button>;
      })}
      <button type="button" className="room-wall-poster" aria-label={wallMovie ? `${tx("电影海报")}：《${wallMovie.title}》` : tx("空画框，记录第一部电影")} onClick={() => { if (wallMovie) showMovie(wallMovie); else { setSpot("小银幕"); setSelected(null); } }}>
        <span className="room-wall-poster__fallback">{wallMovie?.title || tx("留给下一部电影")}</span>
        {wallMovie?.cover && <img key={wallMovie.cover} src={wallMovie.cover} alt={wallMovie.title} onError={e => { e.currentTarget.style.display = "none"; }} />}
      </button>
      {([{name:"窗边",left:25,top:10,width:32,height:44},{name:"书架",left:7,top:33,width:13,height:39},{name:"唱片机",left:73,top:47,width:16,height:10},{name:"桌上便签",left:34,top:70,width:23,height:12}] as const).filter(item => item.name !== "书架" || books.length === 0).map(item => <button key={item.name} type="button" className="room-hotspot" style={{left:`${item.left}%`,top:`${item.top}%`,width:`${item.width}%`,height:`${item.height}%`}} aria-label={tx(item.name)} aria-pressed={spot === item.name} onClick={() => {setSpot(item.name);setSelected(null);}} />)}
      <Link to="/memories" className="room-hotspot" style={{left:"70%",top:"57%",width:"23%",height:"23%"}} aria-label={tx("记忆胶囊")} />
    </div>
    <div className="room-collection-controls">
      <div><span>{tx("书架")} · {books.length} {tx("本")}</span>{pageCount > 1 && <span className="ml-2 inline-flex items-center gap-2"><button type="button" disabled={currentPage === 0} aria-label={tx("上一排书")} onClick={() => setBookPage(currentPage - 1)}>←</button><span>{currentPage + 1} / {pageCount}</span><button type="button" disabled={currentPage === pageCount - 1} aria-label={tx("下一排书")} onClick={() => setBookPage(currentPage + 1)}>→</button></span>}</div>
      {movies.length > 0 && <label className="flex min-w-0 items-center gap-2"><span className="shrink-0">{tx("墙上海报")}</span><select aria-label={tx("选择墙上的电影海报")} value={wallMovie?.id} onChange={e => { const movie = movies.find(m => m.id === e.target.value); if (movie) showMovie(movie); }}>{movies.map(movie => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</select></label>}
    </div>
    <div className="painted-room__spots" aria-label={tx("房间")}>{(Object.keys(details) as Spot[]).map(s => <button key={s} type="button" aria-pressed={spot === s} onClick={() => { setSpot(s); setSelected(null); }}>{tx(s)}</button>)}<Link to="/memories" className="rounded-full border border-[var(--border)] bg-[#f8ded6] px-4 py-2 text-xs">{tx("记忆胶囊")} ↗</Link></div>
    <div className="painted-room__detail" aria-live="polite"><p className="font-serif text-base">{selected?.title || details[spot]}</p>{selected?.note && <p className="mt-2 text-sm text-[var(--quiet)]">{selected.note}</p>}{things.length > 0 && <div className="painted-room__objects">{things.map(x => <button key={x.id} onClick={() => { setSelected(x); if (spot === "小银幕") setMovieId(x.id); if (spot === "书架") setBookPage(Math.floor(books.findIndex(book => book.id === x.id) / 8)); }}>{x.src ? <img src={x.src} alt="" loading="lazy"/> : <span className="mb-2 flex h-26 items-center justify-center rounded border border-[var(--border)] bg-[#e7eff9] px-2 font-serif">{x.title}</span>}{x.title}</button>)}</div>}<Link to="/add" search={{ type:spot === "书架" ? "book" : spot === "小银幕" ? "movie" : "sentence" }} className="mt-4 inline-block text-xs text-[var(--bluegrey)]">{tx("留下生活痕迹")} ＋</Link></div>
  </section>;
}
