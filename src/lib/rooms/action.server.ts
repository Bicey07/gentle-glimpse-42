import { Connection, PublicKey } from "@solana/web3.js";
import { decodeInvite } from "./model";
import { buildRoomKey, DEVNET_GENESIS, DEVNET_RPC } from "./transactions";

export const actionHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
  "Access-Control-Expose-Headers": "X-Action-Version, X-Blockchain-Ids",
  "X-Action-Version": "2.4",
  "X-Blockchain-Ids": `solana:${DEVNET_GENESIS}`,
  "Cache-Control": "no-store",
};
export function actionJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: actionHeaders });
}
export async function roomAction(request: Request, rpc?: Connection): Promise<Response> {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: actionHeaders });
  const url = new URL(request.url);
  let room;
  try {
    room = decodeInvite(url.searchParams.get("invite") ?? "");
  } catch {
    return actionJson({ message: "Invalid room invitation." }, 400);
  }
  if (request.method === "GET") {
    return actionJson({
      type: "action",
      icon: new URL("/icons/quiet-space-192.png", url.origin).href,
      title: `${room.name} · Room Key`,
      description: `${room.description}\nDevnet demo: self-claim one non-transferable Room Key. This public invitation is unverified. Your wallet pays test SOL for rent and fees. No private notes go on-chain; this does not grant Cloud membership.`,
      label: "领取 Devnet Room Key",
    });
  }
  if (request.method !== "POST") return actionJson({ message: "Method not allowed." }, 405);
  let account: PublicKey;
  try {
    if (Number(request.headers.get("content-length")) > 1024)
      return actionJson({ message: "Request too large." }, 413);
    const text = await request.text();
    if (text.length > 1024) return actionJson({ message: "Request too large." }, 413);
    const body = JSON.parse(text);
    if (typeof body.account !== "string") throw new Error();
    account = new PublicKey(body.account);
    if (!PublicKey.isOnCurve(account.toBytes())) throw new Error();
  } catch {
    return actionJson({ message: "A valid wallet account is required." }, 400);
  }
  try {
    const { transaction } = await buildRoomKey(
      rpc ??
        new Connection(DEVNET_RPC, {
          commitment: "confirmed",
          disableRetryOnRateLimit: true,
          fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
        }),
      account,
      room,
    );
    return actionJson({
      type: "transaction",
      transaction: transaction.serialize({ requireAllSignatures: false }).toString("base64"),
      message: "Self-issued Devnet Room Key. Non-transferable; private content stays off-chain.",
    });
  } catch {
    return actionJson({ message: "Solana Devnet is unavailable. Please try again shortly." }, 503);
  }
}
