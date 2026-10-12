# Rooms: Passport → Invitation / Blink → Shared Memory

This is a hackathon demo with optional **real Solana Devnet** transactions. No issuer key, database migration, mainnet funds or new environment variables are required. Existing Supabase email login, membership and private room notes keep their existing permissions. The new journey is local and deliberately separate from Cloud authorization.

## Run and demo

Use Node 22.16+ and `npm install`, then `npm run dev`. Open `/rooms`.

1. Create a room with a name, public invitation and color. Its local Room Key appears in Room Passport.
2. Open **邀请朋友** and copy the invitation URL. Open it in another browser and accept; only the public card metadata travels in this link. It does not give access to the creator's local memories or Cloud notes.
3. Optionally connect Phantom with Devnet SOL, read the disclosure, and claim the non-transferable key. The UI records the signature before broadcasting, shows pending status, and marks success only after confirmation without a transaction error. Inspect the mint/transaction in Explorer.
4. Leave a Shared Memory: title, date, place, people, sentence and optional local PNG/JPEG/WebP cover (max 1 MB). Export its JSON backup. Optionally anchor only its salted SHA-256 proof in a Devnet Memo.
5. Return to `/rooms`, export the passport, and refresh to verify local persistence.

No wallet is needed for steps 1, 2, 4 or 5. Wallet connection is **not** SIWS or account authentication. Declining a wallet prompt should leave the local record intact.

## What is real, and what is a prototype

- **Real chain primitive:** Token-2022 `NonTransferable`, zero decimals, exactly one unit in the claimant's associated account; mint authority is revoked and there is no freeze authority. Each claim creates a unique mint. A signed Memo binds it to a room ID hash. Wallets may display it as an unnamed token because this version has no token metadata service.
- **Self-issued credential:** membership is self-declared. There is no verified room issuer, global claim deduplication, recovery/indexing across devices or server-verified token gate. The app prevents duplicate local claims, including pending transactions, but a separate browser or Action request can mint another credential. Never use these credentials for security-sensitive access.
- **Local passport:** contains local joins and optional verified transaction receipts; a local join alone is clearly marked as not on-chain. Data is scoped to the current Supabase account or guest, but browser storage is not an encryption boundary.
- **Memory:** stored unencrypted in this browser, never included in invite URLs. The cover, location, names and sentence are not posted to the chain. The salted commitment reveals its signer and transaction time. It is one person's assertion, **not** multi-party proof of attendance. Listed companions have not signed.
- **Exports:** portable JSON backups; a passport export excludes memories. Memory exports contain private content and the nonce needed to recompute their proof. Keep them private. Import/recovery is not part of this version.
- **Pending transactions:** check the receipt before retrying. If a transaction is absent after its last valid block height has finalized, it is marked failed and may be retried. RPC outages keep it pending. Wallet rejection does not create a receipt. A storage failure before submission prevents broadcasting.

## Blinks

`GET /api/room-key?invite=<base64url-public-room-card>` returns Action metadata. `POST` accepts `{ "account": "<wallet public key>" }` and returns a partially signed, serialized Devnet transaction using the same Room Key builder as the in-app claim. The requester pays only mint/account rent and transaction fees, with **test SOL**. The server neither pays nor submits transactions.

`OPTIONS`, `/actions.json`, CORS and the Devnet blockchain header are implemented. Deploy the TanStack server to a publicly reachable HTTPS origin; the invite panel then offers **复制 Room Blink**, using Dialect's interstitial. Localhost deliberately offers only the ordinary invitation. Public invitation data is editable and unverified; do not treat it as authenticated room metadata. Neither Action GET nor POST reads private content.

External Blink claims do not automatically import a receipt or create a Supabase membership in Quiet Space. The credential remains in the signing wallet. Social-feed expansion depends on the client and domain verification; a valid API alone does not guarantee it. Before a public launch add issuer verification, abuse/rate limits, claim indexing and signature-verified receipt recovery.

## Verification

- `npm run test:rooms`: invitation validation, idempotent joins, salted/reproducible proofs, invalid dates/images, exact Token-2022 transaction construction and mint-authority revocation, required signatures, Action CORS and invalid requests.
- `npm run typecheck`
- `npm run build`
- Manual wallet checks: missing Phantom, rejection, insufficient Devnet SOL, changed wallet, successful receipt, RPC timeout and pending confirmation. These require an actual wallet and funded Devnet account.
- Manual UI checks: create → share → fresh-browser accept → refresh → memory with cover → JSON export; mobile widths; guest/account switching; invalid invitation.

Official references: [Non-transferable tokens](https://solana.com/docs/tokens/extensions/non-transferrable-tokens), [Actions and Blinks](https://solana.com/docs/tools/actions).

## Validation in this workspace (2026-10-11)

Passed: 12 automated tests, TypeScript checking, ESLint for all changed TypeScript files, Cloudflare production build, and HTTP checks for Rooms, a seeded room, invalid invitations, Action metadata and CORS preflight. Full-repository lint still reports pre-existing errors in untouched files, mostly formatting.

No browser was connected, so visual/mobile interaction checks were not performed. The public Devnet RPC timed out from this machine; live RPC transaction construction and Phantom signing/broadcasting remain unverified. Transaction construction, mint signatures and Action POST responses were tested with mocked RPC blockhash/rent data; no transaction was broadcast during development.
