import { Buffer } from "buffer/index.js";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  type Connection,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  getAssociatedTokenAddressSync,
  createInitializeNonTransferableMintInstruction,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { sha256, type JourneyRoom } from "./model";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
export const explorer = (signature: string) =>
  `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
export function memoInstruction(wallet: PublicKey, message: string) {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM,
    keys: [{ pubkey: wallet, isSigner: true, isWritable: false }],
    // web3 types use Node's Buffer; its instruction serializer also accepts
    // the browser Buffer implementation (both carry the same Uint8Array bytes).
    data: Buffer.from(message, "utf8") as unknown as TransactionInstruction["data"],
  });
}
// Self-issued demo credential: one unique mint per claim, no privileged issuer or secret.
// This does not authorize access to private Cloud rooms or verify real-world attendance.
export async function buildRoomKey(connection: Connection, wallet: PublicKey, room: JourneyRoom) {
  const mint = Keypair.generate();
  const length = getMintLen([ExtensionType.NonTransferable]);
  const [rent, latest] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(length),
    connection.getLatestBlockhash("confirmed"),
  ]);
  const ata = getAssociatedTokenAddressSync(mint.publicKey, wallet, false, TOKEN_2022_PROGRAM_ID);
  const transaction = new Transaction({ feePayer: wallet, ...latest }).add(
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: mint.publicKey,
      space: length,
      lamports: rent,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(mint.publicKey, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint.publicKey, 0, wallet, null, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(
      wallet,
      ata,
      wallet,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createMintToInstruction(mint.publicKey, ata, wallet, 1, [], TOKEN_2022_PROGRAM_ID),
    createSetAuthorityInstruction(
      mint.publicKey,
      wallet,
      AuthorityType.MintTokens,
      null,
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
    memoInstruction(wallet, `quiet-space:room-key:v1:${await sha256(room.id)}`),
  );
  transaction.partialSign(mint);
  return { transaction, mint: mint.publicKey.toBase58(), latest };
}
