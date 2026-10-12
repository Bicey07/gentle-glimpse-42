import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { DEVNET_RPC, memoInstruction, buildRoomKey } from "./transactions";
import type { JourneyRoom, Receipt } from "./model";

type Provider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect(): Promise<{ publicKey: PublicKey }>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
};
function provider(): Provider {
  const target = window as unknown as { phantom?: { solana?: Provider }; solana?: Provider };
  const wallet = target.phantom?.solana ?? target.solana;
  if (!wallet?.isPhantom || !wallet.signTransaction)
    throw new Error("请在安装了 Phantom 的浏览器中打开，并准备少量 Devnet SOL。");
  return wallet;
}
export async function connectWallet() {
  return (await provider().connect()).publicKey.toBase58();
}
function connection() {
  return new Connection(DEVNET_RPC, "confirmed");
}
export async function receiptStatus(receipt: Receipt): Promise<Receipt["status"]> {
  const rpc = connection();
  const result = await rpc.getSignatureStatuses([receipt.signature], {
    searchTransactionHistory: true,
  });
  const status = result.value[0];
  if (status?.err) return "failed";
  if (
    !status &&
    receipt.lastValidBlockHeight &&
    (await rpc.getBlockHeight("finalized")) > receipt.lastValidBlockHeight
  )
    return "failed";
  return status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized"
    ? "confirmed"
    : "pending";
}
async function signAndSubmit(
  transaction: Transaction,
  walletAddress: string,
  mint: string | undefined,
  save: (receipt: Receipt) => void,
) {
  const wallet = provider();
  if (wallet.publicKey?.toBase58() !== walletAddress)
    throw new Error("钱包账户已切换，请重新连接后再试。");
  const signed = await wallet.signTransaction(transaction);
  if (wallet.publicKey?.toBase58() !== walletAddress)
    throw new Error("钱包账户已切换，请重新连接后再试。");
  // Persist signature BEFORE broadcast. A timeout must never result in a duplicate mint.
  const { default: bs58 } = await import("bs58");
  if (!signed.signature) throw new Error("钱包没有返回交易签名。");
  const receipt: Receipt = {
    signature: bs58.encode(signed.signature),
    wallet: walletAddress,
    mint,
    status: "pending",
    lastValidBlockHeight: transaction.lastValidBlockHeight,
  };
  save(receipt);
  const rpc = connection();
  await rpc.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
  const result = await rpc.confirmTransaction(
    {
      signature: receipt.signature,
      blockhash: transaction.recentBlockhash!,
      lastValidBlockHeight: transaction.lastValidBlockHeight!,
    },
    "confirmed",
  );
  if (result.value.err) {
    save({ ...receipt, status: "failed" });
    throw new Error("Devnet 交易未成功，房间记录仍保留在本地。");
  }
  save({ ...receipt, status: "confirmed" });
}
export async function claimRoomKey(
  room: JourneyRoom,
  walletAddress: string,
  save: (receipt: Receipt) => void,
) {
  const built = await buildRoomKey(connection(), new PublicKey(walletAddress), room);
  await signAndSubmit(built.transaction, walletAddress, built.mint, save);
}
export async function anchorMemory(
  proof: string,
  walletAddress: string,
  save: (receipt: Receipt) => void,
) {
  if (!/^[0-9a-f]{64}$/.test(proof)) throw new Error("记忆摘要无效。");
  const wallet = new PublicKey(walletAddress);
  const latest = await connection().getLatestBlockhash("confirmed");
  const transaction = new Transaction({ feePayer: wallet, ...latest }).add(
    memoInstruction(wallet, `quiet-space:shared-memory:v1:${proof}`),
  );
  await signAndSubmit(transaction, walletAddress, undefined, save);
}
