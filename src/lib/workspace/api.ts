import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../integrations/supabase/client";
import type { Database, Json } from "../../integrations/supabase/types";
import {
  documentSchema,
  validateFile,
  type DocumentInput,
  type RoomDocument,
  type DocumentComment,
  type DocumentFile,
  type DocumentVersion,
} from "./model";
import { roomSchema } from "../rooms/model";
type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};
type WorkspaceDatabase = {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      room_documents: Table<RoomDocument>;
      room_document_versions: Table<DocumentVersion>;
      room_document_comments: Table<DocumentComment>;
      room_document_files: Table<DocumentFile>;
    };
    Functions: Database["public"]["Functions"] & {
      reverie_save_document: {
        Args: {
          _id: string;
          _room: string;
          _title: string;
          _body: string;
          _category: string;
          _status: string;
          _version: number;
        };
        Returns: RoomDocument;
      };
      quiet_create_invite: { Args: { _room: string; _expected_user: string }; Returns: string };
      quiet_invite_preview: { Args: { _token: string }; Returns: Json };
      quiet_accept_invite: { Args: { _token: string; _expected_user: string }; Returns: string };
    };
  };
};
const db = supabase as unknown as SupabaseClient<WorkspaceDatabase>;
function check(error: unknown) {
  if (error) throw error;
}
async function requireUser(expected: string) {
  const { data, error } = await db.auth.getUser();
  check(error);
  if (data.user?.id !== expected) throw new Error("账户已变化，请重新打开页面。");
}
export async function loadWorkspace(room: string) {
  const [docs, members] = await Promise.all([
    db
      .from("room_documents")
      .select("*")
      .eq("room_id", room)
      .order("updated_at", { ascending: false })
      .limit(500),
    db.from("room_members").select("user_id").eq("room_id", room),
  ]);
  check(docs.error);
  check(members.error);
  const ids = members.data!.map((m) => m.user_id);
  const profiles = ids.length
    ? await db.from("profiles").select("id,display_name").in("id", ids)
    : { data: [], error: null };
  check(profiles.error);
  return {
    documents: docs.data!,
    members: ids.map((id) => ({
      id,
      name: profiles.data?.find((p) => p.id === id)?.display_name || "一位邻居",
    })),
  };
}
export async function saveDocument(input: DocumentInput, userId: string) {
  const d = documentSchema.parse(input);
  await requireUser(userId);
  const { data, error } = await db.rpc("reverie_save_document", {
    _id: d.id,
    _room: d.room_id,
    _title: d.title,
    _body: d.body,
    _category: d.category,
    _status: d.status,
    _version: d.version,
  }).single<RoomDocument>();
  if (error?.code === "23505" && d.version === 0) {
    const existing = await db
      .from("room_documents")
      .select("*")
      .eq("id", d.id)
      .eq("room_id", d.room_id)
      .single();
    if (
      existing.data?.author_id === userId &&
      existing.data.title === d.title &&
      existing.data.body === d.body &&
      existing.data.category === d.category &&
      existing.data.status === d.status
    )
      return existing.data;
    throw new Error("这个页面已保存过。请回到小组打开最新版本；当前草稿已暂存。");
  }
  check(error);
  if (!data) throw new Error("未收到保存结果，请重试。");
  return data;
}
export async function loadDocument(id: string) {
  const [doc, comments, files, versions] = await Promise.all([
    db.from("room_documents").select("*").eq("id", id).single(),
    db
      .from("room_document_comments")
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("room_document_files").select("*").eq("document_id", id).order("created_at").limit(200),
    db
      .from("room_document_versions")
      .select("*")
      .eq("document_id", id)
      .order("version", { ascending: false })
      .limit(20),
  ]);
  check(doc.error);
  check(comments.error);
  check(files.error);
  check(versions.error);
  return {
    document: doc.data!,
    comments: comments.data!.reverse(),
    files: files.data!,
    versions: versions.data!,
  };
}
export async function addComment(document: RoomDocument, body: string, userId: string, id: string) {
  if (!body.trim() || body.trim().length > 5000) throw new Error("评论需要 1–5000 个字。");
  await requireUser(userId);
  const { error } = await db
    .from("room_document_comments")
    .insert({
      id,
      document_id: document.id,
      room_id: document.room_id,
      author_id: userId,
      body: body.trim(),
    });
  // Retrying a timed-out submission with the same id must not duplicate the comment.
  if (error?.code !== "23505") check(error);
}
export async function uploadDocumentFile(document: RoomDocument, file: File, userId: string) {
  const mime = validateFile(file);
  await requireUser(userId);
  const id = crypto.randomUUID();
  const path = `${document.room_id}/${document.id}/${userId}/${id}`;
  const upload = await db.storage
    .from("room-files")
    .upload(path, file, { contentType: mime, upsert: false });
  check(upload.error);
  const insert = await db
    .from("room_document_files")
    .insert({
      id,
      document_id: document.id,
      room_id: document.room_id,
      uploader_id: userId,
      name: file.name,
      path,
      mime,
      size: file.size,
    });
  if (insert.error) {
    // RLS prevents cleanup of a committed attachment, even after an ambiguous network failure.
    await db.storage.from("room-files").remove([path]);
    throw insert.error;
  }
}
export async function fileUrl(file: DocumentFile, download = false) {
  const { data, error } = await db.storage
    .from("room-files")
    .createSignedUrl(file.path, 300, download ? { download: file.name } : undefined);
  check(error);
  return data!.signedUrl;
}
export async function createInvite(room: string, userId: string) {
  await requireUser(userId);
  const { data, error } = await db.rpc("quiet_create_invite", {
    _room: room,
    _expected_user: userId,
  });
  check(error);
  return `${window.location.origin}/invite?token=${encodeURIComponent(data!)}`;
}
export async function previewInvite(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("邀请无效，请让朋友重新发一份。");
  const { data, error } = await db.rpc("quiet_invite_preview", { _token: token });
  check(error);
  if (!data) throw new Error("邀请已过期，请让朋友重新生成链接。");
  return roomSchema.parse(data);
}
export async function acceptInvite(token: string, userId: string) {
  await requireUser(userId);
  const { data, error } = await db.rpc("quiet_accept_invite", {
    _token: token,
    _expected_user: userId,
  });
  check(error);
  return data!;
}
export async function loadFiles(room: string | undefined, hasDocuments: boolean) {
  if (!room || !hasDocuments) return [];
  const { data, error } = await db
    .from("room_document_files")
    .select("*")
    .eq("room_id", room)
    .order("created_at", { ascending: false })
    .limit(200);
  check(error);
  return data!;
}
export async function loadDiscussion(room: string) {
  const [comments, notes] = await Promise.all([
    db
      .from("room_document_comments")
      .select("*")
      .eq("room_id", room)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("room_notes")
      .select("*")
      .eq("room_id", room)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  check(comments.error);
  check(notes.error);
  return { comments: comments.data!, notes: notes.data! };
}
