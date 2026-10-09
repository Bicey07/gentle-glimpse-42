// Cloud data access for signed-in users. Browser client only (RLS applies);
// never use a service-role key here.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Person } from "./types";

type EntryRow = Database["public"]["Tables"]["entries"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const IMAGE_BUCKET = "entry-images";
export const BOOK_COVER =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=70";
export const MOVIE_COVER =
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=70";

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
}

export interface CloudSnapshot {
  me: Person;
  friends: Person[];
  entries: (EntryRow & { personId: string; imageUrl?: string })[];
  replies: { id: string; personId: string; fromName: string; text: string; at: number }[];
  roomNotes: { id: string; roomId: string; fromName: string; text: string; at: number }[];
  myRooms: string[];
  incomingRequests: FriendRequest[];
  outgoingPending: string[];
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function personFrom(p: ProfileRow | undefined, id: string, entries: CloudSnapshot["entries"]): Person {
  const mine = entries.filter((e) => e.user_id === p?.id || e.personId === id);
  const latest = (k: EntryRow["kind"]) => mine.find((e) => e.kind === k);
  const status = latest("status");
  const book = latest("book");
  const movie = latest("movie");
  const sentence = mine.find((e) => e.kind === "sentence" && e.visibility === "friends") ?? latest("sentence");
  const image = latest("image");
  return {
    id,
    name: p?.display_name || "朋友",
    bio: p?.bio || "在城里慢慢生活。",
    color: p?.color || "#8fa3b5",
    recent: {
      mood: status?.mood ?? undefined,
      reading: book ? { title: book.title ?? "", author: book.creator ?? "—" } : undefined,
      watching: movie ? { title: movie.title ?? "", director: movie.creator ?? "—" } : undefined,
      sentence: sentence?.text ?? (status?.text || undefined),
      imageUrl: image?.imageUrl,
    },
  };
}

export async function loadCloud(userId: string): Promise<CloudSnapshot> {
  const [fsRes, entriesRes, repliesRes, membersRes] = await Promise.all([
    supabase.from("friendships").select("*"),
    supabase.from("entries").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("replies").select("*").eq("author_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.from("room_members").select("room_id").eq("user_id", userId),
  ]);
  fail(fsRes.error); fail(entriesRes.error); fail(repliesRes.error); fail(membersRes.error);

  const friendships = fsRes.data ?? [];
  const accepted = friendships.filter((f) => f.status === "accepted");
  const friendIds = accepted.map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id));
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === userId);
  const outgoingPending = friendships
    .filter((f) => f.status === "pending" && f.requester_id === userId)
    .map((f) => f.addressee_id);
  const myRooms = (membersRes.data ?? []).map((m) => m.room_id);

  const notesRes = myRooms.length
    ? await supabase.from("room_notes").select("*").in("room_id", myRooms).order("created_at", { ascending: false }).limit(200)
    : { data: [], error: null };
  fail(notesRes.error);
  const notes = notesRes.data ?? [];

  const profileIds = Array.from(
    new Set([userId, ...friendIds, ...incoming.map((f) => f.requester_id), ...notes.map((n) => n.user_id)]),
  );
  const profRes = await supabase.from("profiles").select("*").in("id", profileIds);
  fail(profRes.error);
  const profiles = new Map((profRes.data ?? []).map((p) => [p.id, p]));

  // Private images → short-lived signed URLs (never stored as base64).
  const rawEntries = entriesRes.data ?? [];
  const paths = rawEntries.map((e) => e.image_path).filter((p): p is string => !!p);
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60);
    (data ?? []).forEach((d) => d.path && d.signedUrl && urlByPath.set(d.path, d.signedUrl));
  }
  const entries = rawEntries.map((e) => ({
    ...e,
    personId: e.user_id === userId ? "me" : e.user_id,
    imageUrl: e.image_path ? urlByPath.get(e.image_path) : undefined,
  }));

  const me = personFrom(profiles.get(userId), "me", entries.filter((e) => e.personId === "me"));
  const friends = friendIds.map((id) => personFrom(profiles.get(id), id, entries.filter((e) => e.user_id === id)));

  return {
    me,
    friends,
    entries,
    replies: (repliesRes.data ?? []).map((r) => ({
      id: r.id, personId: r.recipient_id, fromName: "你", text: r.text, at: Date.parse(r.created_at),
    })),
    roomNotes: notes.map((n) => ({
      id: n.id,
      roomId: n.room_id,
      fromName: n.user_id === userId ? "你" : profiles.get(n.user_id)?.display_name || "一位住客",
      text: n.text,
      at: Date.parse(n.created_at),
    })),
    myRooms,
    incomingRequests: incoming.map((f) => ({
      id: f.id, fromId: f.requester_id, fromName: profiles.get(f.requester_id)?.display_name || "一位朋友",
    })),
    outgoingPending,
  };
}

type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];

export async function insertEntry(row: Omit<EntryInsert, "user_id">, userId: string) {
  const { error } = await supabase.from("entries").insert({ ...row, user_id: userId });
  fail(error);
}

export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("只能上传图片。");
  if (file.size > 10 * 1024 * 1024) throw new Error("图片不能超过 10MB。");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: file.type, upsert: false,
  });
  fail(error);
  return path;
}

export async function removeImage(path: string) {
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

export async function insertReply(userId: string, recipientId: string, text: string) {
  const { error } = await supabase.from("replies").insert({ author_id: userId, recipient_id: recipientId, text });
  fail(error);
}

export async function joinRoom(userId: string, roomId: string) {
  const { error } = await supabase.from("room_members").upsert(
    { room_id: roomId, user_id: userId },
    { onConflict: "room_id,user_id", ignoreDuplicates: true },
  );
  fail(error);
}

export async function insertRoomNote(userId: string, roomId: string, text: string) {
  const { error } = await supabase.from("room_notes").insert({ room_id: roomId, user_id: userId, text });
  fail(error);
}

export async function requestFriend(userId: string, code: string) {
  const id = code.trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("好友码格式不对。");
  if (id === userId) throw new Error("这是你自己的好友码。");
  const { error } = await supabase.from("friendships").insert({ requester_id: userId, addressee_id: id });
  if (error?.code === "23505") throw new Error("你们之间已经有一扇门了。");
  if (error?.code === "23503") throw new Error("没有找到这个好友码。");
  fail(error);
}

export async function acceptFriend(friendshipId: string) {
  const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
  fail(error);
}
