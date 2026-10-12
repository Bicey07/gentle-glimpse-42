import assert from "node:assert/strict";
import test from "node:test";
import { PublicKey, Keypair, Transaction, SystemProgram, type Connection } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  decodeInitializeMintInstruction,
  decodeMintToInstruction,
  decodeSetAuthorityInstruction,
} from "@solana/spl-token";
import {
  decodeInvite,
  encodeInvite,
  emptyJourney,
  joinJourney,
  makeMemory,
  memoryPayload,
  sha256,
  journeySchema,
} from "../src/lib/rooms/model";
import { buildRoomKey, MEMO_PROGRAM } from "../src/lib/rooms/transactions";
import { roomAction } from "../src/lib/rooms/action.server";

const room = {
  id: "room-test",
  name: "周六一起看展 🌱",
  description: "两点，在美术馆门口见。",
  color: "#C9D3DE",
};
const input = {
  roomId: room.id,
  roomName: room.name,
  title: "一起看展",
  date: "2026-10-10",
  location: "美术馆",
  people: "我、青羽",
  note: "慢慢走，也很好。",
};

test("Chinese invitations round-trip without private data", () => {
  const encoded = encodeInvite(room);
  assert.deepEqual(decodeInvite(encoded), room);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(Object.keys(decodeInvite(encoded)).sort(), [
    "color",
    "description",
    "id",
    "name",
  ]);
});
test("invitation rejects corrupt, oversized, injected or incomplete payloads", () => {
  for (const value of [
    "",
    "bad%url",
    "A".repeat(2401),
    btoa(JSON.stringify({ id: "../escape" })),
    btoa(JSON.stringify({ ...room, name: "a", description: "a", color: "url(https://evil.test)" })),
    btoa(JSON.stringify({ ...room, name: "a", description: "a", privateNote: "secret" })),
  ]) {
    assert.throws(() => decodeInvite(value));
  }
});
test("joining is idempotent and conflicting invitation cannot overwrite a passport", () => {
  const once = joinJourney(emptyJourney, room);
  const twice = joinJourney(once, room);
  assert.equal(twice.keys.length, 1);
  assert.equal(twice.rooms.length, 1);
  assert.equal(twice.keys[0].joinedAt, once.keys[0].joinedAt);
  assert.throws(() => joinJourney(once, { ...room, name: "impostor" }));
  assert.deepEqual(journeySchema.parse(JSON.parse(JSON.stringify(twice))), twice);
});
test("memory proof is reproducible, salted, changes with content, excludes receipt", async () => {
  const memory = await makeMemory(input);
  assert.equal(await sha256(memoryPayload(memory)), memory.proof);
  assert.notEqual((await makeMemory(input)).proof, memory.proof);
  assert.notEqual(await sha256(memoryPayload({ ...memory, note: "edited" })), memory.proof);
  assert.equal(
    await sha256(
      memoryPayload({ ...memory, receipt: { signature: "x", wallet: "x", status: "confirmed" } }),
    ),
    memory.proof,
  );
});
test("memory validates actual dates, required fields and safe image types", async () => {
  await assert.rejects(() => makeMemory({ ...input, date: "2026-02-30" }));
  await assert.rejects(() => makeMemory({ ...input, title: "   " }));
  await assert.rejects(() => makeMemory({ ...input, cover: "data:image/svg+xml;base64,aaa=" }));
  await assert.rejects(() => makeMemory({ ...input, cover: "https://example.com/tracker.png" }));
});
test("Room Key transaction uses NonTransferable, mints exactly one, and revokes authority", async () => {
  const wallet = Keypair.generate();
  const rpc = {
    getMinimumBalanceForRentExemption: async () => 2_000_000,
    getLatestBlockhash: async () => ({
      blockhash: Keypair.generate().publicKey.toBase58(),
      lastValidBlockHeight: 123456,
    }),
  } as unknown as Connection;
  const built = await buildRoomKey(rpc, wallet.publicKey, room);
  const instructions = built.transaction.instructions;
  assert.equal(instructions.length, 7);
  assert.ok(instructions[0].programId.equals(SystemProgram.programId));
  assert.ok(instructions[1].programId.equals(TOKEN_2022_PROGRAM_ID));
  assert.equal(instructions[1].data[0], 32); // InitializeNonTransferableMint discriminator
  const initialized = decodeInitializeMintInstruction(instructions[2], TOKEN_2022_PROGRAM_ID);
  assert.equal(initialized.data.decimals, 0);
  assert.equal(initialized.data.freezeAuthority, null);
  assert.ok(instructions[3].programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID));
  const mintTo = decodeMintToInstruction(instructions[4], TOKEN_2022_PROGRAM_ID);
  assert.equal(mintTo.data.amount, 1n);
  const revoke = decodeSetAuthorityInstruction(instructions[5], TOKEN_2022_PROGRAM_ID);
  assert.equal(revoke.data.authorityType, AuthorityType.MintTokens);
  assert.equal(revoke.data.newAuthority, null);
  assert.ok(instructions[6].programId.equals(MEMO_PROGRAM));
  assert.equal(instructions[6].data.toString(), `quiet-space:room-key:v1:${await sha256(room.id)}`);
  assert.ok(!instructions[6].data.toString().includes(room.name));
  // Action payload remains partly signed by the generated mint, requiring the invited wallet.
  const roundTrip = Transaction.from(built.transaction.serialize({ requireAllSignatures: false }));
  assert.equal(
    roundTrip.signatures.find((s) => s.publicKey.equals(wallet.publicKey))?.signature,
    null,
  );
  assert.ok(
    roundTrip.signatures.find((s) => s.publicKey.equals(new PublicKey(built.mint)))?.signature,
  );
  roundTrip.partialSign(wallet);
  assert.equal(roundTrip.verifySignatures(), true);
});
test("Action GET / OPTIONS have CORS, devnet headers, accurate public metadata", async () => {
  const url = `https://quiet.test/api/room-key?invite=${encodeInvite(room)}`;
  const result = await roomAction(new Request(url));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("access-control-allow-origin"), "*");
  assert.match(result.headers.get("x-blockchain-ids")!, /^solana:EtW/);
  const body = await result.json();
  assert.equal(body.type, "action");
  assert.match(body.description, /self-claim/);
  assert.equal(body.icon, "https://quiet.test/icons/quiet-space-192.png");
  assert.equal((await roomAction(new Request(url, { method: "OPTIONS" }))).status, 204);
});
test("Action rejects malformed invitations and wallet accounts before contacting RPC", async () => {
  assert.equal(
    (await roomAction(new Request("https://quiet.test/api/room-key?invite=bad"))).status,
    400,
  );
  for (const body of ['{"account":"invalid"}', "not json", "x".repeat(1025)]) {
    const response = await roomAction(
      new Request(`https://quiet.test/api/room-key?invite=${encodeInvite(room)}`, {
        method: "POST",
        body,
      }),
    );
    assert.ok([400, 413].includes(response.status));
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  }
});

test("valid Action POST returns a mint-signed transaction for the requested wallet", async () => {
  const wallet = Keypair.generate();
  const request = new Request(`https://quiet.test/api/room-key?invite=${encodeInvite(room)}`, {
    method: "POST",
    body: JSON.stringify({ account: wallet.publicKey.toBase58() }),
  });
  const rpc = {
    getMinimumBalanceForRentExemption: async () => 2_000_000,
    getLatestBlockhash: async () => ({
      blockhash: Keypair.generate().publicKey.toBase58(),
      lastValidBlockHeight: 123456,
    }),
  } as unknown as Connection;
  const response = await roomAction(request, rpc);
  assert.equal(response.status, 200);
  const body = await response.json();
  const transaction = Transaction.from(Buffer.from(body.transaction, "base64"));
  assert.ok(transaction.feePayer?.equals(wallet.publicKey));
  assert.equal(transaction.instructions.length, 7);
  transaction.partialSign(wallet);
  assert.ok(transaction.verifySignatures());
});

test("Action reports RPC failure without fabricating a transaction", async () => {
  const rpc = {
    getMinimumBalanceForRentExemption: async () => {
      throw new Error("offline");
    },
    getLatestBlockhash: async () => ({ blockhash: "unused", lastValidBlockHeight: 1 }),
  } as unknown as Connection;
  const response = await roomAction(
    new Request(`https://quiet.test/api/room-key?invite=${encodeInvite(room)}`, {
      method: "POST",
      body: JSON.stringify({ account: Keypair.generate().publicKey.toBase58() }),
    }),
    rpc,
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).transaction, undefined);
});

test("passport storage survives reload and isolates accounts", async () => {
  const { createJourneyStore } = await import("../src/lib/rooms/store");
  const data = new Map<string, string>();
  const storage = () => ({
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  });
  const guest = createJourneyStore("guest", storage);
  guest.initialize();
  guest.join(room);
  const refreshed = createJourneyStore("guest", storage);
  refreshed.initialize();
  assert.deepEqual(refreshed.getSnapshot(), guest.getSnapshot());
  const user = createJourneyStore("different-user", storage);
  user.initialize();
  assert.equal(user.getSnapshot().keys.length, 0);
});

test("storage quota and corrupted data never become successful joins", async () => {
  const { createJourneyStore } = await import("../src/lib/rooms/store");
  const full = createJourneyStore("guest", () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  }));
  full.initialize();
  assert.throws(() => full.join(room), /存储已满/);
  assert.equal(full.getSnapshot().keys.length, 0);
  let writes = 0;
  const corrupt = createJourneyStore("guest", () => ({
    getItem: () => "{corrupt",
    setItem: () => {
      writes++;
    },
  }));
  corrupt.initialize();
  assert.ok(corrupt.getError());
  assert.throws(() => corrupt.join(room));
  assert.equal(writes, 0);
});
