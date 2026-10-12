import { useRef, useState } from "react";
import { Camera, Download, Fingerprint, Plus } from "lucide-react";
import {
  errorText,
  exportJson,
  makeMemory,
  memoryPayload,
  sha256,
  type JourneyRoom,
  type Receipt,
  type SharedMemory,
} from "../../lib/rooms/model";
import { useJourney } from "../../lib/rooms/store";
import { JourneyButton, JourneyLabel, ReceiptView, fieldClass } from "./JourneyUi";

type Props = { room: JourneyRoom; scope: string; wallet: string };
export function SharedMemories({ room, scope, wallet }: Props) {
  const journey = useJourney(scope);
  const joined = journey.state.keys.some((key) => key.roomId === room.id);
  const memories = journey.state.memories.filter((m) => m.roomId === room.id);
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState<string>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [consent, setConsent] = useState(false);
  async function perform(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const refresh = (memory: SharedMemory) =>
    perform(async () => {
      if (!memory.receipt) return;
      const { receiptStatus } = await import("../../lib/rooms/wallet");
      const status = await receiptStatus(memory.receipt);
      journey.setMemoryReceipt(memory.id, { ...memory.receipt, status });
    });
  const anchor = (memory: SharedMemory) =>
    perform(async () => {
      if (!wallet || !consent) throw new Error("请先连接钱包，并确认公开摘要。");
      if ((await sha256(memoryPayload(memory))) !== memory.proof)
        throw new Error("记忆与摘要不一致，不能上链。");
      const { anchorMemory } = await import("../../lib/rooms/wallet");
      await anchorMemory(memory.proof, wallet, (receipt: Receipt) =>
        journey.setMemoryReceipt(memory.id, receipt),
      );
      setNotice("这段记忆的摘要已在 Devnet 确认。");
    });
  return (
    <section className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <JourneyLabel>Shared Memory</JourneyLabel>
        <Camera size={18} strokeWidth={1.2} className="text-[var(--quiet)]" />
      </div>
      <h2 className="mt-3 font-serif text-xl">把「一起」留下来</h2>
      <p className="mt-2 text-xs leading-relaxed text-[var(--quiet)]">
        一次看展，一段散步，一句共同留下的话。
      </p>
      {!joined ? (
        <p className="my-5 text-xs text-[var(--quiet)]">收下 Room Key 后，就可以记录共同记忆。</p>
      ) : (
        !open && (
          <JourneyButton className="mt-5" secondary onClick={() => setOpen(true)}>
            <Plus size={13} />
            留下一段共同记忆
          </JourneyButton>
        )
      )}
      {open && joined && (
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void perform(async () => {
              const memory = await makeMemory({
                roomId: room.id,
                roomName: room.name,
                title: String(data.get("title") ?? ""),
                date: String(data.get("date") ?? ""),
                location: String(data.get("location") ?? ""),
                people: String(data.get("people") ?? ""),
                note: String(data.get("note") ?? ""),
                cover,
              });
              journey.addMemory(memory);
              setOpen(false);
              setCover(undefined);
              setNotice("已经留在当前浏览器。可以导出保存，也可以选择为摘要留下 Devnet 回执。");
            });
          }}
        >
          <label className="block text-xs">
            记忆的名字
            <input
              name="title"
              className={fieldClass}
              maxLength={60}
              required
              placeholder="那天下午，看完展去喝了咖啡"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0 text-xs">
              那一天
              <input type="date" name="date" className={`${fieldClass} min-w-0`} required />
            </label>
            <label className="min-w-0 text-xs">
              那个地方
              <input
                name="location"
                className={fieldClass}
                maxLength={100}
                required
                placeholder="美术馆"
              />
            </label>
          </div>
          <label className="block text-xs">
            同行的人
            <input
              name="people"
              className={fieldClass}
              maxLength={160}
              required
              placeholder="我、青羽、林一"
            />
          </label>
          <label className="block text-xs">
            共同留下的一句话
            <textarea
              name="note"
              className={fieldClass}
              maxLength={500}
              rows={3}
              required
              placeholder="什么都不用赶的一天。"
            />
          </label>
          <label className="block text-xs">
            封面（可选，PNG / JPG / WebP，最多 1 MB）
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              className="mt-2 w-full text-xs file:mr-2 file:rounded-full file:border file:border-[var(--border)] file:bg-[var(--paper)] file:px-3 file:py-2"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setCover(undefined);
                  return;
                }
                if (
                  file.size > 1024 * 1024 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                ) {
                  setNotice("请选择 1 MB 以内的 PNG、JPG 或 WebP 图片。");
                  e.target.value = "";
                  setCover(undefined);
                  return;
                }
                void perform(async () => {
                  const data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = () => reject(new Error("封面读取失败。"));
                    reader.readAsDataURL(file);
                  });
                  setCover(data);
                });
              }}
            />
          </label>
          {cover && (
            <img
              src={cover}
              alt="共同记忆封面预览"
              className="h-32 w-full rounded-xl object-cover"
            />
          )}
          <p className="text-[11px] leading-relaxed text-[var(--quiet)]">
            这是一份由你记录的共同记忆，同行者尚未签名确认。内容保存在本机，未加密，也不会自动发给朋友。
          </p>
          <div className="flex flex-wrap gap-2">
            <JourneyButton type="submit" disabled={busy}>
              {busy ? "正在保存…" : "留在我们的小世界"}
            </JourneyButton>
            <JourneyButton
              secondary
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setCover(undefined);
              }}
            >
              取消
            </JourneyButton>
          </div>
        </form>
      )}
      {memories.length === 0 && !open && (
        <div className="mt-5 border-t border-dashed border-[var(--border)] pt-5 font-serif text-sm text-[var(--quiet)]">
          等一次相遇，成为我们的记忆。
        </div>
      )}
      {memories.length > 0 && (
        <div className="mt-6 space-y-5">
          {memories.map((memory) => (
            <article
              key={memory.id}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--paper)]"
            >
              {memory.cover ? (
                <img src={memory.cover} alt={memory.title} className="h-40 w-full object-cover" />
              ) : (
                <div
                  className="flex h-20 items-center justify-center"
                  style={{ background: room.color }}
                >
                  <Camera size={26} strokeWidth={1} className="opacity-50" />
                </div>
              )}
              <div className="p-4">
                <p className="text-[10px] tracking-wider text-[var(--quiet)]">
                  {memory.date} · {memory.location}
                </p>
                <h3 className="mt-2 font-serif text-lg">{memory.title}</h3>
                <p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-relaxed">
                  {memory.note}
                </p>
                <p className="mt-3 text-xs text-[var(--quiet)]">一起的人 · {memory.people}</p>
                <p className="mt-2 text-[10px] text-[var(--quiet)]">
                  由你记录 · 尚未获得同行者签名
                </p>
                <details className="mt-4 text-[10px] text-[var(--quiet)]">
                  <summary className="cursor-pointer">内容摘要 SHA-256</summary>
                  <p className="mt-2 break-all font-mono">{memory.proof}</p>
                </details>
                <div className="mt-4 flex flex-wrap gap-2">
                  <JourneyButton
                    secondary
                    onClick={() =>
                      exportJson(`shared-memory-${memory.id}.json`, {
                        format: "quiet-space-shared-memory-v1",
                        ...memory,
                      })
                    }
                  >
                    <Download size={12} />
                    导出记忆
                  </JourneyButton>
                  {(!memory.receipt || memory.receipt.status === "failed") && (
                    <JourneyButton
                      secondary
                      disabled={busy || !wallet || !consent}
                      onClick={() => void anchor(memory)}
                    >
                      <Fingerprint size={12} />
                      将摘要留在 Devnet
                    </JourneyButton>
                  )}
                </div>
                {memory.receipt && (
                  <ReceiptView
                    receipt={memory.receipt}
                    busy={busy}
                    onRefresh={() => void refresh(memory)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {memories.length > 0 && (
        <label className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-[var(--quiet)]">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          我同意公开摘要、签名钱包和交易时间，并支付 Devnet
          测试费用。文字、照片、地点和同行者名单不上链。这是我的声明，不等于其他人确认到场。
        </label>
      )}
      {notice && (
        <p role="status" className="mt-4 text-xs leading-relaxed text-[var(--ink)]">
          {notice}
        </p>
      )}
    </section>
  );
}
