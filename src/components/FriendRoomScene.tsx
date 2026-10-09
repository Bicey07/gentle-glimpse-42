import { useMemo, useState, type CSSProperties } from "react";
import type { BookEntry, ImageEntry, MovieEntry, Person } from "../lib/types";

type RoomSpot = "window" | "books" | "screen" | "record" | "note";

interface FriendRoomSceneProps {
  person: Person;
  books: BookEntry[];
  movies: MovieEntry[];
  images: ImageEntry[];
}

const spotLabels: Record<RoomSpot, string> = {
  window: "窗边",
  books: "书架",
  screen: "小银幕",
  record: "唱片机",
  note: "桌上便签",
};

export function FriendRoomScene({ person, books, movies, images }: FriendRoomSceneProps) {
  const [activeSpot, setActiveSpot] = useState<RoomSpot>("window");
  const recent = person.recent;
  const featuredBook = books[0] ?? recent.reading;
  const featuredMovie = movies[0] ?? recent.watching;
  const featuredImage = images[0]?.url ?? recent.imageUrl;

  const details = useMemo<Record<RoomSpot, { eyebrow: string; title: string; body: string }>>(
    () => ({
      window: {
        eyebrow: "今天的天气",
        title: recent.mood ?? "房间很安静",
        body: recent.freeDays?.length
          ? `可能有空：${recent.freeDays.join("、")}`
          : "来过就好，不用立刻说什么。",
      },
      books: {
        eyebrow: "最近翻到这里",
        title: featuredBook ? `《${featuredBook.title}》` : "书架还留着空位",
        body: featuredBook
          ? "author" in featuredBook
            ? featuredBook.author
            : ""
          : "也许下一次来，会多一本喜欢的书。",
      },
      screen: {
        eyebrow: "今晚放映",
        title: featuredMovie ? `《${featuredMovie.title}》` : "银幕暂时熄着",
        body: featuredMovie?.director ?? "等一部值得慢慢看完的电影。",
      },
      record: {
        eyebrow: "房间里的声音",
        title: recent.listening?.title ?? "一段很轻的环境声",
        body: recent.listening?.artist ?? "把音量留在刚好听见的位置。",
      },
      note: {
        eyebrow: "留在桌上的一句",
        title: recent.sentence ? `「${recent.sentence}」` : (recent.weekPlan ?? "今天没有留言"),
        body: recent.weekPlan ? `这周想做：${recent.weekPlan}` : "有些日子不记录，也完整。",
      },
    }),
    [featuredBook, featuredMovie, recent],
  );

  const selectSpot = (spot: RoomSpot) => setActiveSpot(spot);
  const roomStyle = { "--friend-accent": person.color } as CSSProperties;

  return (
    <section className="mb-10" aria-label={`${person.name}的可拜访房间`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-[var(--quiet)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
          正在安静拜访
        </div>
        <span className="text-[10px] text-[var(--quiet)]">点一点房间里的物件</span>
      </div>

      <div
        className="friend-room room-breathe overflow-hidden rounded-[30px] border border-white/60"
        style={roomStyle}
      >
        <div className="friend-room__wall">
          <div className="friend-room__light" />

          <button
            type="button"
            className="friend-room__window room-drift"
            aria-label="看看窗边"
            aria-pressed={activeSpot === "window"}
            onClick={() => selectSpot("window")}
          >
            <span className="friend-room__sun" />
            <span className="friend-room__cloud" />
          </button>

          <button
            type="button"
            className="friend-room__frame"
            aria-label="看看小银幕"
            aria-pressed={activeSpot === "screen"}
            onClick={() => selectSpot("screen")}
          >
            {featuredImage ? (
              <img src={featuredImage} alt="房间里的一张生活照片" loading="lazy" />
            ) : (
              <span className="friend-room__landscape" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className="friend-room__shelf"
            aria-label="看看书架"
            aria-pressed={activeSpot === "books"}
            onClick={() => selectSpot("books")}
          >
            <span className="friend-room__books" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="friend-room__shelf-board" />
          </button>

          <div className="friend-room__avatar" aria-label={`${person.name}的人物形象`}>
            <span className="friend-room__hair" />
            <span className="friend-room__face">
              <i />
              <i />
            </span>
            <span className="friend-room__body" />
          </div>

          <button
            type="button"
            className="friend-room__record-player"
            aria-label="看看唱片机"
            aria-pressed={activeSpot === "record"}
            onClick={() => selectSpot("record")}
          >
            <span className="friend-room__vinyl" />
            <span className="friend-room__needle" />
          </button>

          <button
            type="button"
            className="friend-room__note"
            aria-label="看看桌上便签"
            aria-pressed={activeSpot === "note"}
            onClick={() => selectSpot("note")}
          >
            {recent.sentence ? "一封小笺" : "本周计划"}
          </button>

          <span className="friend-room__plant" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="friend-room__rug" aria-hidden="true" />
        </div>

        <div className="friend-room__detail" aria-live="polite">
          <div>
            <p className="text-[10px] tracking-[0.22em] text-[var(--quiet)]">
              {details[activeSpot].eyebrow}
            </p>
            <h2 className="mt-1 font-serif text-[18px] text-[var(--ink)]">
              {details[activeSpot].title}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--quiet)]">
              {details[activeSpot].body}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5" aria-label="房间角落">
            {(Object.keys(spotLabels) as RoomSpot[]).map((spot) => (
              <button
                key={spot}
                type="button"
                onClick={() => selectSpot(spot)}
                className={`rounded-full px-2.5 py-1 text-[10px] transition-colors ${
                  activeSpot === spot
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-white/65 text-[var(--quiet)] hover:text-[var(--ink)]"
                }`}
              >
                {spotLabels[spot]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
