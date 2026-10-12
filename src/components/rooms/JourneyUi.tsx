import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight, KeyRound, LoaderCircle } from "lucide-react";
import type { Receipt } from "../../lib/rooms/model";

export const fieldClass =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 text-sm outline-none focus:border-[var(--bluegrey)]";
export function JourneyButton({
  children,
  secondary = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${secondary ? "border-[var(--border)] bg-transparent text-[var(--ink)] hover:bg-[var(--paper)]" : "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:opacity-85"} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
export function JourneyLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--quiet)]">{children}</div>
  );
}
export function LocalNotice() {
  return (
    <p className="mt-3 text-[11px] leading-relaxed text-[var(--quiet)]">
      演示护照与记忆只保存在当前浏览器，不自动同步给其他成员。Devnet 凭证可选，私密内容留在链下。
    </p>
  );
}
export function ReceiptView({
  receipt,
  onRefresh,
  busy,
}: {
  receipt: Receipt;
  onRefresh: () => void;
  busy: boolean;
}) {
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-3 text-xs">
      <div className="flex items-center gap-2">
        <KeyRound size={13} />
        {receipt.status === "confirmed"
          ? "Devnet 已确认"
          : receipt.status === "failed"
            ? "交易失败 · 可重新尝试"
            : "已签名 · 等待确认"}
      </div>
      <p className="mt-2 break-all text-[10px] text-[var(--quiet)]">钱包 {receipt.wallet}</p>
      {receipt.mint && (
        <p className="mt-1 break-all text-[10px] text-[var(--quiet)]">Mint {receipt.mint}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <a
          href={`https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-4"
        >
          查看交易 <ArrowUpRight size={12} />
        </a>
        {receipt.status === "pending" && (
          <button
            type="button"
            disabled={busy}
            onClick={onRefresh}
            className="inline-flex items-center gap-1 disabled:opacity-50"
          >
            {busy && <LoaderCircle size={12} className="animate-spin" />}检查确认状态
          </button>
        )}
      </div>
      {receipt.status === "pending" && (
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--quiet)]">
          网络中断时交易仍可能成功。先检查回执，请勿重复领取。
        </p>
      )}
    </div>
  );
}
