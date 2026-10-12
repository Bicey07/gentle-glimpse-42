import { useI18n } from "@/lib/i18n";
import { useRef, useState } from "react";
import { Check, Copy, KeyRound, Share2, Wallet } from "lucide-react";
import { useStore } from "../../lib/store";
import { useJourney } from "../../lib/rooms/store";
import { encodeInvite, errorText, type JourneyRoom } from "../../lib/rooms/model";
import { JourneyButton, JourneyLabel, LocalNotice, ReceiptView } from "./JourneyUi";
import { SharedMemories } from "./SharedMemories";

export function RoomJourney({ room }: { room: JourneyRoom }) {
  const scope = useStore((s) => s.userId ?? "guest");
  return <JourneyContent key={`${scope}:${room.id}`} scope={scope} room={room} />;
}
function JourneyContent({ room, scope }: { room: JourneyRoom; scope: string }) {
  const { t: tx } = useI18n();
  const journey = useJourney(scope);
  const roomKey = journey.state.keys.find((key) => key.roomId === room.id);
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [share, setShare] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [blinkUrl, setBlinkUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const lock = useRef(false);
  async function perform(fn: () => void | Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function showShare() {
    const invite = encodeInvite(room);
    setInviteUrl(`${window.location.origin}/invite?room=${invite}`);
    const action = `${window.location.origin}/api/room-key?invite=${invite}`;
    setBlinkUrl(
      window.location.protocol === "https:"
        ? `https://dial.to/?action=${encodeURIComponent(`solana-action:${action}`)}&cluster=devnet`
        : "",
    );
    setShare(!share);
  }
  return (
    <div className="mb-10">
      <ol className="mb-5 grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--quiet)]">
        <li>{tx("01 · 邀请相遇")}</li>
        <li>{tx("02 · 收下钥匙")}</li>
        <li>{tx("03 · 留下记忆")}</li>
      </ol>
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <JourneyLabel>Your Room Key</JourneyLabel>
          <KeyRound size={21} strokeWidth={1.2} />
        </div>
        <h2 className="mt-3 font-serif text-xl">
          {roomKey ? tx("这个小世界，有你的位置。") : tx("给自己留一个位置。")}
        </h2>
        <p className="mt-3 text-xs leading-relaxed text-[var(--quiet)]">
          {tx("私密内容留在链下。「我属于哪些小世界」，由自己保存。")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {roomKey ? (
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs"
              style={{ background: room.color }}
            >
              <Check size={13} />
              {roomKey.receipt?.status === "confirmed"
                ? tx("已领取 Devnet Room Key")
                : tx("已收下本地 Room Key")}
            </span>
          ) : (
            <JourneyButton
              disabled={busy || !!journey.error}
              onClick={() => void perform(() => journey.join(room))}
            >
              <KeyRound size={13} />
              {tx("加入演示 · 收下 Room Key")}
            </JourneyButton>
          )}
          <JourneyButton secondary onClick={showShare}>
            <Share2 size={13} />
            {tx("邀请朋友")}
          </JourneyButton>
        </div>
        <LocalNotice />
        {journey.error && (
          <p role="alert" className="mt-3 text-xs text-red-800">
            {tx(journey.error)}
          </p>
        )}
        {share && (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <JourneyLabel>A small invitation</JourneyLabel>
            <p className="mt-3 font-serif text-base">{room.name}</p>
            <p className="mt-2 text-xs text-[var(--quiet)]">{room.description}</p>
            <label className="mt-4 block text-[11px] text-[var(--quiet)]">
              {tx("邀请链接")}
              <input
                aria-label={tx("邀请链接")}
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.target.select()}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] p-2 text-xs"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <JourneyButton
                secondary
                onClick={() =>
                  void perform(async () => {
                    await navigator.clipboard.writeText(inviteUrl);
                    setNotice("邀请已复制。新浏览器可以打开邀请并加入自己的演示护照。");
                  })
                }
              >
                <Copy size={12} />
                {tx("复制邀请")}
              </JourneyButton>
              {blinkUrl && (
                <JourneyButton
                  secondary
                  onClick={() =>
                    void perform(async () => {
                      await navigator.clipboard.writeText(blinkUrl);
                      setNotice("Blink 已复制，外部钱包可在 Devnet 领取凭证。");
                    })
                  }
                >
                  {tx("复制 Room Blink")}
                </JourneyButton>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-[var(--quiet)]">
              {tx("邀请只分享公开房间介绍，不同步纸条或记忆。")}
              {blinkUrl
                ? tx(
                    "Blink 会打开外部钱包领取 Devnet 凭证，回执不会自动写回本地护照；社交平台内展开取决于客户端与域名审核。",
                  )
                : tx("本地预览支持普通邀请；部署到公开 HTTPS 域名后会出现 Room Blink。")}
            </p>
          </div>
        )}
        {roomKey && (
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <JourneyLabel>Optional · Solana Devnet</JourneyLabel>
            <p className="mt-3 text-xs leading-relaxed text-[var(--quiet)]">
              {tx(
                "把钥匙放进钱包：一枚不可转让的演示凭证。自行领取，不代表房主认证，也不替代云端房间的访问权限。",
              )}
            </p>
            {!wallet ? (
              <JourneyButton
                secondary
                className="mt-4"
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    const { connectWallet } = await import("../../lib/rooms/wallet");
                    setWallet(await connectWallet());
                  })
                }
              >
                <Wallet size={13} />
                {tx("连接 Phantom")}
              </JourneyButton>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                <span className="min-w-0 break-all font-mono text-[10px] text-[var(--quiet)]">
                  {wallet}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setWallet("");
                    setConsent(false);
                  }}
                  className="shrink-0 text-[10px] underline"
                >
                  {tx("断开")}
                </button>
              </div>
            )}
            {(!roomKey.receipt || roomKey.receipt.status === "failed") && (
              <>
                <label className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-[var(--quiet)]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 shrink-0"
                  />
                  {tx(
                    "我同意公开钱包与房间标识摘要的关联，并支付少量 Devnet 测试 SOL（创建账户及手续费）。房间名称和私密内容不上链。",
                  )}
                </label>
                <JourneyButton
                  className="mt-4"
                  disabled={busy || !wallet || !consent}
                  onClick={() =>
                    void perform(async () => {
                      const { claimRoomKey } = await import("../../lib/rooms/wallet");
                      await claimRoomKey(room, wallet, (receipt) =>
                        journey.setKeyReceipt(room.id, receipt),
                      );
                      setNotice("Room Key 已在 Devnet 确认，并保存在你的钱包。");
                    })
                  }
                >
                  {busy ? tx("请等待钱包或网络…") : tx("领取不可转让的 Devnet Key")}
                </JourneyButton>
              </>
            )}
            {roomKey.receipt && (
              <ReceiptView
                receipt={roomKey.receipt}
                busy={busy}
                onRefresh={() =>
                  void perform(async () => {
                    const { receiptStatus } = await import("../../lib/rooms/wallet");
                    const receipt = roomKey.receipt!;
                    journey.setKeyReceipt(room.id, {
                      ...receipt,
                      status: await receiptStatus(receipt),
                    });
                  })
                }
              />
            )}
          </div>
        )}
        {notice && (
          <p role="status" className="mt-4 text-xs leading-relaxed">
            {tx(notice)}
          </p>
        )}
      </section>
      <SharedMemories room={room} scope={scope} wallet={wallet} />
    </div>
  );
}
