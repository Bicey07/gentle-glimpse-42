import { useSyncExternalStore } from "react";
import {
  me as initialMe,
  friends as initialFriends,
  books as initialBooks,
  movies as initialMovies,
  sentences as initialSentences,
  images as initialImages,
  traces as initialTraces,
} from "../data/mockData";
import type {
  Person,
  BookEntry,
  MovieEntry,
  SentenceEntry,
  ImageEntry,
  Trace,
} from "./types";

export type Visibility = "self" | "friends";

export interface Reply {
  id: string;
  personId: string;
  fromName: string;
  text: string;
  at: number;
}

export interface RoomNote {
  id: string;
  roomId: string;
  fromName: string;
  text: string;
  at: number;
}

interface State {
  me: Person;
  friends: Person[];
  books: (BookEntry & { visibility?: Visibility })[];
  movies: (MovieEntry & { visibility?: Visibility })[];
  sentences: (SentenceEntry & { visibility?: Visibility; at?: number })[];
  images: (ImageEntry & { visibility?: Visibility })[];
  traces: Trace[];
  replies: Reply[];
  roomNotes: RoomNote[];
}

const STORAGE_KEY = "quiet-space:v2";

const seededRoomNotes: RoomNote[] = [
  { id: "rn_seed1", roomId: "tokyo-life", fromName: "林一", text: "今天去了下北泽的旧书店，买到了一本很旧的诗集。", at: Date.now() - 1000 * 60 * 60 * 20 },
  { id: "rn_seed2", roomId: "tokyo-life", fromName: "阿野", text: "早上的中目黑很安静，河边一个人在跑步。", at: Date.now() - 1000 * 60 * 60 * 8 },
  { id: "rn_seed3", roomId: "tokyo-life", fromName: "小满", text: "在便利店买了一个饭团当晚饭，也很好。", at: Date.now() - 1000 * 60 * 60 * 2 },
  { id: "rn_seed4", roomId: "weekend-exhibition", fromName: "青羽", text: "周六下午想去看那个安藤忠雄的展，一个人也可以。", at: Date.now() - 1000 * 60 * 60 * 30 },
  { id: "rn_seed5", roomId: "weekend-exhibition", fromName: "林一", text: "如果那天下雨，展后可以喝杯咖啡。", at: Date.now() - 1000 * 60 * 60 * 12 },
  { id: "rn_seed6", roomId: "weekend-exhibition", fromName: "安安", text: "我可能周日下午有空，也想去看看。", at: Date.now() - 1000 * 60 * 60 * 3 },
];

const initial: State = {
  me: { ...initialMe },
  friends: initialFriends.map((f) => ({ ...f })),
  books: [...initialBooks],
  movies: [...initialMovies],
  sentences: initialSentences.map((s) => ({ ...s, visibility: "friends" as Visibility })),
  images: initialImages.map((i) => ({ ...i, visibility: "friends" as Visibility })),
  traces: [...initialTraces],
  replies: [],
  roomNotes: seededRoomNotes,
};

function loadPersisted(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return initial;
    return {
      ...initial,
      ...parsed,
      me: { ...initial.me, ...(parsed.me ?? {}), recent: { ...initial.me.recent, ...(parsed.me?.recent ?? {}) } },
      friends: Array.isArray(parsed.friends) && parsed.friends.length ? parsed.friends : initial.friends,
      books: Array.isArray(parsed.books) ? parsed.books : initial.books,
      movies: Array.isArray(parsed.movies) ? parsed.movies : initial.movies,
      sentences: Array.isArray(parsed.sentences) ? parsed.sentences : initial.sentences,
      images: Array.isArray(parsed.images) ? parsed.images : initial.images,
      traces: Array.isArray(parsed.traces) ? parsed.traces : initial.traces,
      replies: Array.isArray(parsed.replies) ? parsed.replies : [],
      roomNotes: Array.isArray(parsed.roomNotes) ? parsed.roomNotes : initial.roomNotes,
    };
  } catch {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    return initial;
  }
}

let state: State = loadPersisted();

const listeners = new Set<() => void>();
function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function pushTrace(t: Omit<Trace, "id">) {
  state = { ...state, traces: [{ id: uid("t"), ...t }, ...state.traces].slice(0, 12) };
}

export const actions = {
  addSentence(text: string, visibility: Visibility) {
    if (!text.trim()) return;
    state = {
      ...state,
      sentences: [
        { id: uid("s"), personId: "me", text: text.trim(), visibility, at: Date.now() },
        ...state.sentences,
      ],
    };
    if (visibility === "friends") {
      pushTrace({ personId: "me", verb: "留下了一句话", detail: text.trim() });
    } else {
      pushTrace({ personId: "me", verb: "写了一句只给自己的话" });
    }
    state = { ...state, me: { ...state.me, recent: { ...state.me.recent, sentence: text.trim() } } };
    emit();
  },
  addImage(url: string, caption: string | undefined, visibility: Visibility) {
    if (!url.trim()) return;
    state = {
      ...state,
      images: [
        { id: uid("i"), personId: "me", url: url.trim(), caption, visibility },
        ...state.images,
      ],
    };
    if (visibility === "friends") {
      pushTrace({ personId: "me", verb: "留下了一张照片" });
    }
    emit();
  },
  addBook(title: string, author: string, note: string | undefined, visibility: Visibility) {
    if (!title.trim()) return;
    const cover = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=70";
    state = {
      ...state,
      books: [
        { id: uid("b"), personId: "me", title: title.trim(), author: author.trim() || "—", cover, note, visibility },
        ...state.books,
      ],
      me: { ...state.me, recent: { ...state.me.recent, reading: { title: title.trim(), author: author.trim() || "—" } } },
    };
    if (visibility === "friends") {
      pushTrace({ personId: "me", verb: "在读", detail: `《${title.trim()}》` });
    }
    emit();
  },
  addMovie(title: string, director: string, note: string | undefined, visibility: Visibility) {
    if (!title.trim()) return;
    const cover = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=70";
    state = {
      ...state,
      movies: [
        { id: uid("m"), personId: "me", title: title.trim(), director: director.trim() || "—", cover, note, visibility },
        ...state.movies,
      ],
      me: { ...state.me, recent: { ...state.me.recent, watching: { title: title.trim(), director: director.trim() || "—" } } },
    };
    if (visibility === "friends") {
      pushTrace({ personId: "me", verb: "在看", detail: `《${title.trim()}》` });
    }
    emit();
  },
  updateMood(mood: string, extra?: string) {
    state = {
      ...state,
      me: { ...state.me, recent: { ...state.me.recent, mood, sentence: extra?.trim() || state.me.recent.sentence } },
    };
    pushTrace({ personId: "me", verb: `把本周状态改成了「${mood}」` });
    emit();
  },
  addReply(personId: string, text: string) {
    if (!text.trim()) return;
    state = {
      ...state,
      replies: [
        { id: uid("r"), personId, fromName: "你", text: text.trim(), at: Date.now() },
        ...state.replies,
      ],
    };
    emit();
  },
  addRoomNote(roomId: string, text: string) {
    if (!text.trim()) return;
    state = {
      ...state,
      roomNotes: [
        { id: uid("rn"), roomId, fromName: "你", text: text.trim(), at: Date.now() },
        ...state.roomNotes,
      ],
    };
    emit();
  },
  resetAll() {
    state = initial;
    emit();
  },
};

export function personEntriesFromStore(s: State, personId: string) {
  return {
    books: s.books.filter((b) => b.personId === personId),
    movies: s.movies.filter((m) => m.personId === personId),
    sentences: s.sentences.filter((x) => x.personId === personId),
    images: s.images.filter((i) => i.personId === personId),
  };
}
