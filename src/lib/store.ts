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
  personId: string;   // 被回应的人
  fromName: string;   // 谁回应（这里默认是"你"）
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
}

let state: State = {
  me: { ...initialMe },
  friends: initialFriends.map((f) => ({ ...f })),
  books: [...initialBooks],
  movies: [...initialMovies],
  sentences: initialSentences.map((s) => ({ ...s, visibility: "friends" as Visibility })),
  images: initialImages.map((i) => ({ ...i, visibility: "friends" as Visibility })),
  traces: [...initialTraces],
  replies: [],
};

const listeners = new Set<() => void>();
function emit() {
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
};

export function personEntriesFromStore(s: State, personId: string) {
  return {
    books: s.books.filter((b) => b.personId === personId),
    movies: s.movies.filter((m) => m.personId === personId),
    sentences: s.sentences.filter((x) => x.personId === personId),
    images: s.images.filter((i) => i.personId === personId),
  };
}
