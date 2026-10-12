import { z } from "zod";

export const roomSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/),
    name: z.string().trim().min(1).max(40),
    description: z.string().trim().max(160),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();
export type JourneyRoom = z.infer<typeof roomSchema>;

export const receiptSchema = z.object({
  signature: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/),
  wallet: z.string().min(32).max(44),
  mint: z.string().min(32).max(44).optional(),
  status: z.enum(["pending", "confirmed", "failed"]),
  lastValidBlockHeight: z.number().int().positive().optional(),
});
export type Receipt = z.infer<typeof receiptSchema>;
export const keySchema = z.object({
  roomId: roomSchema.shape.id,
  joinedAt: z.string().datetime(),
  receipt: receiptSchema.optional(),
});
export type RoomKey = z.infer<typeof keySchema>;
export const memoryInputSchema = z.object({
  roomId: roomSchema.shape.id,
  roomName: roomSchema.shape.name,
  title: z.string().trim().min(1, "给这段记忆起个名字吧。").max(60),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => {
      const date = new Date(`${s}T00:00:00Z`);
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === s;
    }, "请选择有效日期。"),
  location: z.string().trim().min(1, "写下我们相遇的地方。").max(100),
  people: z.string().trim().min(1, "写下同行的人。").max(160),
  note: z.string().trim().min(1, "留下一句话吧。").max(500),
  cover: z
    .string()
    .max(1_400_000)
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
    .optional(),
});
export type MemoryInput = z.infer<typeof memoryInputSchema>;
export const memorySchema = memoryInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  nonce: z.string().uuid(),
  proof: z.string().regex(/^[0-9a-f]{64}$/),
  receipt: receiptSchema.optional(),
});
export type SharedMemory = z.infer<typeof memorySchema>;
export const journeySchema = z.object({
  version: z.literal(1),
  rooms: z.array(roomSchema).max(100),
  keys: z.array(keySchema).max(200),
  memories: z.array(memorySchema).max(100),
});
export type Journey = z.infer<typeof journeySchema>;
export const emptyJourney: Journey = { version: 1, rooms: [], keys: [], memories: [] };

// Invitations deliberately contain ONLY public room card metadata, never members or notes.
export function encodeInvite(room: JourneyRoom): string {
  const bytes = new TextEncoder().encode(JSON.stringify(roomSchema.parse(room)));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function decodeInvite(value: string): JourneyRoom {
  if (!/^[A-Za-z0-9_-]{1,2400}$/.test(value)) throw new Error("邀请链接不完整或已损坏。");
  try {
    const bytes = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0),
    );
    return roomSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch {
    throw new Error("邀请链接不完整或已损坏。");
  }
}

export async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
export function memoryPayload(memory: Omit<SharedMemory, "proof"> | SharedMemory): string {
  // Fixed order makes exported proofs reproducible. Receipt is deliberately excluded.
  return JSON.stringify({
    version: 1,
    id: memory.id,
    roomId: memory.roomId,
    roomName: memory.roomName,
    title: memory.title,
    date: memory.date,
    location: memory.location,
    people: memory.people,
    note: memory.note,
    cover: memory.cover ?? null,
    createdAt: memory.createdAt,
    nonce: memory.nonce,
  });
}
export async function makeMemory(input: MemoryInput): Promise<SharedMemory> {
  const draft = {
    ...memoryInputSchema.parse(input),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    nonce: crypto.randomUUID(),
  };
  return { ...draft, proof: await sha256(memoryPayload(draft)) };
}
export function joinJourney(state: Journey, room: JourneyRoom): Journey {
  const validRoom = roomSchema.parse(room);
  const existing = state.rooms.find((r) => r.id === validRoom.id);
  if (
    existing &&
    (existing.name !== validRoom.name ||
      existing.description !== validRoom.description ||
      existing.color !== validRoom.color)
  ) {
    throw new Error("这封邀请与已保存的房间信息不一致，请向发起人索取新链接。");
  }
  return {
    ...state,
    rooms: state.rooms.some((r) => r.id === validRoom.id)
      ? state.rooms
      : [...state.rooms, validRoom],
    keys: state.keys.some((k) => k.roomId === validRoom.id)
      ? state.keys
      : [...state.keys, { roomId: validRoom.id, joinedAt: new Date().toISOString() }],
  };
}
export function errorText(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "请检查输入。";
  return error instanceof Error ? error.message : "没能完成，请稍后再试。";
}
export function exportJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
