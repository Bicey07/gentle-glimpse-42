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
import type { Person, BookEntry, MovieEntry, SentenceEntry, ImageEntry, Trace } from "./types";
import * as cloud from "./cloud";

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

export type Mode = "demo" | "cloud";

export type ActionResult = { ok: true } | { ok: false; reason: "auth" | "error"; message: string };

interface State {
  mode: Mode;
  userId: string | null;
  email: string | null;
  loading: boolean;
  loadError: string | null;
  me: Person;
  friends: Person[];
  books: (BookEntry & { visibility?: Visibility })[];
  movies: (MovieEntry & { visibility?: Visibility })[];
  sentences: (SentenceEntry & { visibility?: Visibility; at?: number })[];
  images: (ImageEntry & { visibility?: Visibility })[];
  traces: Trace[];
  replies: Reply[];
  roomNotes: RoomNote[];
  myRooms: string[];
  incomingRequests: cloud.FriendRequest[];
  outgoingPending: string[];
}

const STORAGE_KEY = "quiet-space:v2";

const seededRoomNotes: RoomNote[] = [
  {
    id: "rn_seed1",
    roomId: "tokyo-life",
    fromName: "林一",
    text: "今天去了下北泽的旧书店，买到了一本很旧的诗集。",
    at: Date.now() - 1000 * 60 * 60 * 20,
  },
  {
    id: "rn_seed2",
    roomId: "tokyo-life",
    fromName: "阿野",
    text: "早上的中目黑很安静，河边一个人在跑步。",
    at: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: "rn_seed3",
    roomId: "tokyo-life",
    fromName: "小满",
    text: "在便利店买了一个饭团当晚饭，也很好。",
    at: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "rn_seed4",
    roomId: "weekend-exhibition",
    fromName: "青羽",
    text: "周六下午想去看那个安藤忠雄的展，一个人也可以。",
    at: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: "rn_seed5",
    roomId: "weekend-exhibition",
    fromName: "林一",
    text: "如果那天下雨，展后可以喝杯咖啡。",
    at: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: "rn_seed6",
    roomId: "weekend-exhibition",
    fromName: "安安",
    text: "我可能周日下午有空，也想去看看。",
    at: Date.now() - 1000 * 60 * 60 * 3,
  },
];

const initial: State = {
  mode: "demo",
  userId: null,
  email: null,
  loading: false,
  loadError: null,
  me: { ...initialMe },
  friends: initialFriends.map((f) => ({ ...f })),
  books: [...initialBooks],
  movies: [...initialMovies],
  sentences: initialSentences.map((s) => ({ ...s, visibility: "friends" as Visibility })),
  images: initialImages.map((i) => ({ ...i, visibility: "friends" as Visibility })),
  traces: [...initialTraces],
  replies: [],
  roomNotes: seededRoomNotes,
  myRooms: [],
  incomingRequests: [],
  outgoingPending: [],
};

// Demo (guest) data: mock data plus whatever an earlier demo session saved
// locally. This is never uploaded to Cloud.
function loadPersisted(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return initial;
    return {
      ...initial,
      me: {
        ...initial.me,
        ...(parsed.me ?? {}),
        recent: { ...initial.me.recent, ...(parsed.me?.recent ?? {}) },
      },
      friends:
        Array.isArray(parsed.friends) && parsed.friends.length ? parsed.friends : initial.friends,
      books: Array.isArray(parsed.books) ? parsed.books : initial.books,
      movies: Array.isArray(parsed.movies) ? parsed.movies : initial.movies,
      sentences: Array.isArray(parsed.sentences) ? parsed.sentences : initial.sentences,
      images: Array.isArray(parsed.images) ? parsed.images : initial.images,
      traces: Array.isArray(parsed.traces) ? parsed.traces : initial.traces,
      replies: Array.isArray(parsed.replies) ? parsed.replies : [],
      roomNotes: Array.isArray(parsed.roomNotes) ? parsed.roomNotes : initial.roomNotes,
    };
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore browsers that block local storage entirely.
    }
    return initial;
  }
}

let state: State = loadPersisted();

const listeners = new Set<() => void>();
function persistDemo() {
  if (typeof window === "undefined" || state.mode !== "demo") return;
  try {
    const { me, friends, books, movies, sentences, images, traces, replies, roomNotes } = state;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ me, friends, books, movies, sentences, images, traces, replies, roomNotes }),
    );
  } catch {
    // Storage can be unavailable in privacy mode. The demo still works in memory.
  }
}
function emit() {
  persistDemo();
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return initial;
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "出了一点小问题，请稍后再试。";
}

const needAuth: ActionResult = { ok: false, reason: "auth", message: "登录后才能放进你的房间。" };

function verbFor(kind: string, detail?: string | null): { verb: string; detail?: string } {
  switch (kind) {
    case "sentence":
      return { verb: "留下了一句话", detail: detail ?? undefined };
    case "image":
      return { verb: "留下了一张照片" };
    case "book":
      return { verb: "在读", detail: detail ? `《${detail}》` : undefined };
    case "movie":
      return { verb: "在看", detail: detail ? `《${detail}》` : undefined };
    default:
      return { verb: "更新了本周状态", detail: detail ?? undefined };
  }
}

function applySnapshot(snap: cloud.CloudSnapshot) {
  const e = snap.entries;
  const vis = (v: string): Visibility => (v === "self" ? "self" : "friends");
  state = {
    ...state,
    loading: false,
    loadError: null,
    me: snap.me,
    friends: snap.friends,
    books: e
      .filter((x) => x.kind === "book")
      .map((x) => ({
        id: x.id,
        personId: x.personId,
        title: x.title ?? "",
        author: x.creator || "—",
        cover: cloud.BOOK_COVER,
        note: x.note ?? undefined,
        visibility: vis(x.visibility),
      })),
    movies: e
      .filter((x) => x.kind === "movie")
      .map((x) => ({
        id: x.id,
        personId: x.personId,
        title: x.title ?? "",
        director: x.creator || "—",
        cover: cloud.MOVIE_COVER,
        note: x.note ?? undefined,
        visibility: vis(x.visibility),
      })),
    sentences: e
      .filter((x) => x.kind === "sentence")
      .map((x) => ({
        id: x.id,
        personId: x.personId,
        text: x.text ?? "",
        visibility: vis(x.visibility),
        at: Date.parse(x.created_at),
      })),
    images: e
      .filter((x) => x.kind === "image" && x.imageUrl)
      .map((x) => ({
        id: x.id,
        personId: x.personId,
        url: x.imageUrl!,
        caption: x.caption ?? undefined,
        visibility: vis(x.visibility),
      })),
    traces: e
      .filter((x) => x.visibility === "friends" || x.personId === "me")
      .slice(0, 12)
      .map((x) => {
        const isSelf = x.visibility === "self";
        const v = isSelf
          ? { verb: "写了一句只给自己的话", detail: undefined }
          : verbFor(
              x.kind,
              x.kind === "book" || x.kind === "movie"
                ? x.title
                : x.kind === "status"
                  ? x.mood
                  : x.text,
            );
        return { id: x.id, personId: x.personId, ...v };
      }),
    replies: snap.replies,
    roomNotes: snap.roomNotes,
    myRooms: snap.myRooms,
    incomingRequests: snap.incomingRequests,
    outgoingPending: snap.outgoingPending,
  };
}

let loadSeq = 0;
async function refresh(): Promise<void> {
  const uid = state.userId;
  if (!uid) return;
  const seq = ++loadSeq;
  try {
    const snap = await cloud.loadCloud(uid);
    if (seq !== loadSeq || state.userId !== uid) return;
    applySnapshot(snap);
  } catch (e) {
    if (seq !== loadSeq) return;
    state = { ...state, loading: false, loadError: errMsg(e) };
  }
  emit();
}

export const session = {
  /** Called from the root auth listener. */
  setUser(user: { id: string; email?: string | null } | null) {
    if (!user) {
      if (state.mode === "demo") return;
      loadSeq++;
      state = loadPersisted();
      emit();
      return;
    }
    if (state.mode === "cloud" && state.userId === user.id) return;
    state = {
      ...initial,
      mode: "cloud",
      userId: user.id,
      email: user.email ?? null,
      loading: true,
      me: { ...initial.me, recent: {} },
      friends: [],
      books: [],
      movies: [],
      sentences: [],
      images: [],
      traces: [],
      replies: [],
      roomNotes: [],
    };
    emit();
    void refresh();
  },
  refresh,
};

async function run(fn: (uid: string) => Promise<void>): Promise<ActionResult> {
  const uid = state.userId;
  if (state.mode !== "cloud" || !uid) return needAuth;
  try {
    await fn(uid);
    await refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", message: errMsg(e) };
  }
}

export const actions = {
  addSentence(text: string, visibility: Visibility) {
    if (!text.trim())
      return Promise.resolve<ActionResult>({
        ok: false,
        reason: "error",
        message: "写一点什么吧，几个字也可以。",
      });
    return run((uid) =>
      cloud.insertEntry({ kind: "sentence", text: text.trim(), visibility }, uid),
    );
  },
  addImage(file: File | null, caption: string | undefined, visibility: Visibility) {
    if (!file)
      return Promise.resolve<ActionResult>({
        ok: false,
        reason: "error",
        message: "先选一张照片。",
      });
    return run(async (uid) => {
      const path = await cloud.uploadImage(file, uid);
      try {
        await cloud.insertEntry(
          { kind: "image", image_path: path, caption: caption?.trim() || null, visibility },
          uid,
        );
      } catch (e) {
        await cloud.removeImage(path);
        throw e;
      }
    });
  },
  addBook(title: string, author: string, note: string | undefined, visibility: Visibility) {
    if (!title.trim())
      return Promise.resolve<ActionResult>({
        ok: false,
        reason: "error",
        message: "写一下书名吧。",
      });
    return run((uid) =>
      cloud.insertEntry(
        {
          kind: "book",
          title: title.trim(),
          creator: author.trim() || null,
          note: note?.trim() || null,
          visibility,
        },
        uid,
      ),
    );
  },
  addMovie(title: string, director: string, note: string | undefined, visibility: Visibility) {
    if (!title.trim())
      return Promise.resolve<ActionResult>({
        ok: false,
        reason: "error",
        message: "写一下片名吧。",
      });
    return run((uid) =>
      cloud.insertEntry(
        {
          kind: "movie",
          title: title.trim(),
          creator: director.trim() || null,
          note: note?.trim() || null,
          visibility,
        },
        uid,
      ),
    );
  },
  updateMood(mood: string, extra?: string) {
    return run((uid) =>
      cloud.insertEntry(
        { kind: "status", mood, text: extra?.trim() || null, visibility: "friends" },
        uid,
      ),
    );
  },
  addReply(personId: string, text: string) {
    if (!text.trim())
      return Promise.resolve<ActionResult>({
        ok: false,
        reason: "error",
        message: "写一句再送出吧。",
      });
    return run((uid) => cloud.insertReply(uid, personId, text.trim()));
  },
  addRoomNote(roomId: string, text: string) {
    if (!text.trim())
      return Promise.resolve<ActionResult>({
        ok: false,
        reason: "error",
        message: "写一句再留下吧。",
      });
    return run(async (uid) => {
      if (!state.myRooms.includes(roomId)) await cloud.joinRoom(uid, roomId);
      await cloud.insertRoomNote(uid, roomId, text.trim());
    });
  },
  joinRoom(roomId: string) {
    return run((uid) => cloud.joinRoom(uid, roomId));
  },
  requestFriend(code: string) {
    return run((uid) => cloud.requestFriend(uid, code));
  },
  acceptFriend(friendshipId: string) {
    return run(() => cloud.acceptFriend(friendshipId));
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
