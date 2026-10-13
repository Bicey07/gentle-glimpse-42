import { z } from "zod";
export const categories = ["writing", "reading", "film", "inspiration", "meeting"] as const;
export const statuses = ["draft", "discussion", "finished"] as const;
export const documentSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().min(1),
  title: z.string().trim().min(1, "请填写标题。").max(120),
  body: z.string().max(100000, "内容最多 10 万字。"),
  category: z.enum(categories),
  status: z.enum(statuses),
  version: z.number().int().min(0),
});
export type DocumentInput = z.infer<typeof documentSchema>;
export type RoomDocument = DocumentInput & {
  author_id: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};
export type DocumentComment = {
  id: string;
  document_id: string;
  room_id: string;
  author_id: string;
  body: string;
  created_at: string;
};
export type DocumentFile = {
  id: string;
  document_id: string;
  room_id: string;
  uploader_id: string;
  name: string;
  path: string;
  mime: string;
  size: number;
  created_at: string;
};
export type DocumentVersion = {
  id: string;
  document_id: string;
  version: number;
  title: string;
  body: string;
  category: DocumentInput["category"];
  status: DocumentInput["status"];
  editor_id: string;
  created_at: string;
};
export type WorkspaceMember = { id: string; name: string };
const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
export const fileAccept = Object.keys(mimeByExtension)
  .map((ext) => "." + ext)
  .join(",");
export function validateFile(file: Pick<File, "name" | "size" | "type">) {
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error("每个文件需大于 0 且不超过 20MB。");
  if (file.name.length > 240) throw new Error("文件名过长，请缩短后重试。");
  const mime = mimeByExtension[file.name.split(".").pop()?.toLowerCase() || ""];
  if (!mime) throw new Error("支持图片、PDF、Word、TXT、Markdown、Excel、PPT 和 CSV 文件。");
  // Browsers often leave Office/Markdown MIME blank; extensions supply the upload MIME.
  if (
    file.type &&
    file.type !== mime &&
    file.type !== "application/octet-stream" &&
    !(mime === "text/markdown" && file.type === "text/plain")
  )
    throw new Error("文件类型与扩展名不一致，请重新选择文件。");
  return mime;
}
export function errorMessage(cause: unknown) {
  const e = cause as { code?: string; message?: string };
  if (e?.code === "40001" || e?.message?.includes("DOCUMENT_CONFLICT"))
    return "朋友刚刚更新了这篇内容。你的文字还在，请复制保留，再读取最新版本后合并。";
  if (e?.code === "42P01" || e?.code === "PGRST205" || e?.code === "PGRST202")
    return "协作空间还在准备中，请稍后再试。";
  return e?.message || "没有保存成功，请检查网络后重试。";
}
export function filterDocuments(docs: RoomDocument[], search: string, category: string) {
  const q = search.trim().toLocaleLowerCase();
  return docs.filter(
    (d) =>
      (category === "all" || d.category === category) &&
      (!q || (d.title + " " + d.body).toLocaleLowerCase().includes(q)),
  );
}
