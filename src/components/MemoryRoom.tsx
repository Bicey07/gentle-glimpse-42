import { useEffect, useRef, useState } from "react";

type Capsule = {
  id: string;
  ciphertext: string;
  iv: string;
  salt: string;
  proof: string;
  createdAt: number;
};

type MemoryPayload = {
  title: string;
  note: string;
  memoryDate: string;
  sharedWith: string;
};

type AmbientAudio = {
  context: AudioContext;
  gain: GainNode;
  oscillators: OscillatorNode[];
};

const STORAGE_KEY = "quiet-space:memory-capsules:v1";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function sealMemory(payload: MemoryPayload, passphrase: string): Promise<Capsule> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  const proof = await crypto.subtle.digest("SHA-256", ciphertext);

  return {
    id: crypto.randomUUID(),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    proof: toBase64(new Uint8Array(proof)),
    createdAt: Date.now(),
  };
}

async function unsealMemory(capsule: Capsule, passphrase: string): Promise<MemoryPayload> {
  const key = await deriveKey(passphrase, fromBase64(capsule.salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(capsule.iv) },
    key,
    fromBase64(capsule.ciphertext),
  );
  return JSON.parse(decoder.decode(plaintext)) as MemoryPayload;
}

function anniversaryLabel(memoryDate: string) {
  if (!memoryDate) return "";
  const source = new Date(`${memoryDate}T00:00:00`);
  if (Number.isNaN(source.getTime())) return "";

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), source.getMonth(), source.getDate());
  if (next < start) next = new Date(today.getFullYear() + 1, source.getMonth(), source.getDate());
  const days = Math.round((next.getTime() - start.getTime()) / 86_400_000);

  if (days === 0) return "今天是这段记忆的纪念日 · 房间亮起了一盏灯";
  return `距离下一次纪念日还有 ${days} 天`;
}

export function MemoryRoom({ name }: { name: string }) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [mode, setMode] = useState<"create" | "unlock" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [sharedWith, setSharedWith] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [revealed, setRevealed] = useState<MemoryPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AmbientAudio | null>(null);
  const selectedCapsule = capsules.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setCapsules(JSON.parse(saved) as Capsule[]);
    } catch {
      setNotice("这台设备暂时无法读取记忆胶囊。");
    }
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.context.close().catch(() => undefined);
    },
    [],
  );

  const closeModal = () => {
    setMode(null);
    setSelectedId(null);
    setPassphrase("");
    setRevealed(null);
    setNotice("");
  };

  const openCreate = () => {
    setTitle("");
    setNote("");
    setMemoryDate("");
    setSharedWith("");
    setPassphrase("");
    setNotice("");
    setMode("create");
  };

  const openCapsule = (id: string) => {
    setSelectedId(id);
    setPassphrase("");
    setRevealed(null);
    setNotice("");
    setMode("unlock");
  };

  const createCapsule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !note.trim()) {
      setNotice("给这段记忆一个名字，再留下一点内容。");
      return;
    }
    if (passphrase.length < 6) {
      setNotice("口令至少需要 6 个字符。");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const capsule = await sealMemory(
        {
          title: title.trim(),
          note: note.trim(),
          memoryDate,
          sharedWith: sharedWith.trim(),
        },
        passphrase,
      );
      const next = [capsule, ...capsules];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setCapsules(next);
      setMode(null);
      setPassphrase("");
      setNotice("记忆已在这台设备上加密，成为房间里的一件物品。");
    } catch {
      setNotice("这次没有封存成功，请稍后再试。");
    } finally {
      setBusy(false);
    }
  };

  const unlockCapsule = async (event: React.FormEvent) => {
    event.preventDefault();
    const capsule = selectedCapsule;
    if (!capsule || !passphrase) return;

    setBusy(true);
    setNotice("");
    try {
      setRevealed(await unsealMemory(capsule, passphrase));
      setPassphrase("");
    } catch {
      setNotice("口令不对，或者这段记忆已经无法读取。");
    } finally {
      setBusy(false);
    }
  };

  const toggleSound = async () => {
    if (audioRef.current) {
      const current = audioRef.current;
      const now = current.context.currentTime;
      current.gain.gain.cancelScheduledValues(now);
      current.gain.gain.setValueAtTime(Math.max(current.gain.gain.value, 0.0001), now);
      current.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      audioRef.current = null;
      setSoundOn(false);
      window.setTimeout(() => current.context.close().catch(() => undefined), 550);
      return;
    }

    try {
      const context = new AudioContext();
      await context.resume();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 620;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 1.2);
      filter.connect(gain).connect(context.destination);

      const low = context.createOscillator();
      low.type = "sine";
      low.frequency.value = 174.61;
      low.connect(filter);

      const high = context.createOscillator();
      high.type = "sine";
      high.frequency.value = 261.63;
      const highGain = context.createGain();
      highGain.gain.value = 0.35;
      high.connect(highGain).connect(filter);

      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.004;
      lfo.connect(lfoGain).connect(gain.gain);

      low.start();
      high.start();
      lfo.start();
      audioRef.current = { context, gain, oscillators: [low, high, lfo] };
      setSoundOn(true);
    } catch {
      setNotice("当前浏览器无法播放环境音。");
    }
  };

  return (
    <section className="mb-16">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--quiet)]">
            Memory Room
          </div>
          <h2 className="mt-2 font-serif text-[20px] text-[var(--ink)]">{name}的小屋</h2>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] text-[var(--quiet)] transition-colors hover:border-[var(--bluegrey)]"
          aria-pressed={soundOn}
        >
          {soundOn ? "◉ 环境音" : "○ 环境音"}
        </button>
      </div>

      <div className="room-breathe relative h-[340px] overflow-hidden rounded-[32px] border border-[#d9d2c5] bg-[#e9e1d2] shadow-[0_24px_70px_rgba(78,69,54,0.12)]">
        <div className="absolute inset-x-0 top-0 h-[68%] bg-[linear-gradient(180deg,#e9eee9_0%,#f1eadf_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(165deg,#cdbfa9_0%,#ddd0bb_48%,#c7b79f_49%,#d8c9b2_100%)]" />

        <div className="absolute left-6 top-7 h-28 w-24 rounded-t-[38px] border-[6px] border-[#f8f3e9] bg-[linear-gradient(180deg,#abc6d3_0%,#dce8df_65%,#d7c8ae_66%)] shadow-[0_8px_20px_rgba(83,104,105,0.12)]">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/70" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/70" />
          <span className="room-drift absolute right-3 top-3 h-3 w-3 rounded-full bg-[#fff8ce] shadow-[0_0_16px_#fff0a3]" />
        </div>

        <div className="absolute right-5 top-9 w-28">
          <div className="h-1 rounded-full bg-[#8d7865]" />
          <div className="mt-2 flex items-end justify-center gap-1.5">
            <span className="h-12 w-3 rounded-sm bg-[#a9b8a4]" />
            <span className="h-9 w-3 rounded-sm bg-[#c99f8d]" />
            <span className="h-11 w-3 rounded-sm bg-[#8fa7b0]" />
            <span className="mb-1 ml-2 h-7 w-8 rounded-t-full bg-[#b7c6a8]" />
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 h-20 w-52 -translate-x-1/2 rounded-[50%] border border-[#c8a98e]/60 bg-[#d9b9a1]/55" />

        <div
          className="room-drift absolute bottom-[70px] left-9 flex flex-col items-center"
          aria-hidden="true"
        >
          <div className="relative h-12 w-12 rounded-full bg-[#efd7c2] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-5 rounded-t-full bg-[#5f554d]" />
            <span className="absolute left-3 top-6 h-1 w-1 rounded-full bg-[#5f554d]" />
            <span className="absolute right-3 top-6 h-1 w-1 rounded-full bg-[#5f554d]" />
          </div>
          <div className="-mt-1 h-16 w-16 rounded-t-[28px] rounded-b-xl bg-[#81968a] shadow-[0_8px_18px_rgba(58,72,64,0.16)]" />
        </div>

        <div className="absolute bottom-[66px] right-5 h-24 w-40 rounded-t-lg bg-[#9b816c] shadow-[0_12px_18px_rgba(72,56,42,0.16)]">
          <div className="absolute -top-2 left-0 right-0 h-3 rounded-full bg-[#745e4d]" />
          <div className="grid h-full grid-cols-3 gap-2 px-3 pb-3 pt-4">
            {capsules.slice(0, 3).map((capsule, index) => (
              <button
                key={capsule.id}
                type="button"
                onClick={() => openCapsule(capsule.id)}
                className="capsule-glow flex h-14 items-center justify-center rounded-t-full border border-[#eadfcf] bg-[#f2e5bd] text-lg shadow-inner transition-transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.7}s` }}
                aria-label={`打开第 ${index + 1} 个加密记忆胶囊`}
              >
                ◇
              </button>
            ))}
            {capsules.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="col-span-3 flex h-14 items-center justify-center rounded-xl border border-dashed border-[#e5d5be] text-xs text-[#f3eadc] transition-colors hover:bg-white/10"
              >
                把第一段记忆放进来 ＋
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/50 bg-[#f8f4ec]/85 px-4 py-3 backdrop-blur-sm">
          <div>
            <div className="text-[11px] text-[var(--ink)]">{capsules.length} 份加密记忆</div>
            <div className="mt-0.5 text-[9px] tracking-wider text-[var(--quiet)]">
              LOCAL AES-GCM · SOLANA DEVNET NEXT
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-[11px] text-[var(--paper)] transition-transform hover:-translate-y-0.5"
          >
            封存记忆
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/65 px-4 py-3 text-[11px] leading-relaxed text-[var(--quiet)]">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[var(--sage)]">●</span>
          <p>
            记忆正文会先在你的设备上加密。当前 Demo
            只保存在本机；黑客松阶段将把加密内容放到链下，并在 Solana Devnet 记录时间与归属证明。
          </p>
        </div>
        {notice && (
          <p className="mt-2 border-t border-[var(--border)] pt-2 text-[var(--ink)]">{notice}</p>
        )}
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#302b25]/35 px-3 backdrop-blur-[2px] sm:items-center">
          <div className="fade-in max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[30px] border border-white/60 bg-[#f8f4ec] p-6 shadow-2xl sm:rounded-[30px]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">
                  {mode === "create" ? "New Memory Capsule" : "Private Memory"}
                </div>
                <h3 className="mt-2 font-serif text-xl text-[var(--ink)]">
                  {mode === "create" ? "封存一段记忆" : "打开记忆胶囊"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-[var(--quiet)]"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {mode === "create" ? (
              <form onSubmit={createCapsule} className="space-y-5">
                <label className="block">
                  <span className="text-[11px] text-[var(--quiet)]">记忆的名字</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="那天下午的风"
                    className="mt-2 w-full border-b border-[var(--border)] bg-transparent py-2 font-serif outline-none focus:border-[var(--bluegrey)]"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-[var(--quiet)]">想保存的内容</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="写下一点只有你们知道的事……"
                    rows={4}
                    className="mt-2 w-full resize-none rounded-2xl border border-[var(--border)] bg-white/45 p-3 font-serif leading-relaxed outline-none focus:border-[var(--bluegrey)]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] text-[var(--quiet)]">发生日期</span>
                    <input
                      type="date"
                      value={memoryDate}
                      onChange={(event) => setMemoryDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white/45 px-3 py-2 text-xs outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-[var(--quiet)]">共同记得的人</span>
                    <input
                      value={sharedWith}
                      onChange={(event) => setSharedWith(event.target.value)}
                      placeholder="朋友的名字"
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white/45 px-3 py-2 text-xs outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[11px] text-[var(--quiet)]">打开口令</span>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(event) => setPassphrase(event.target.value)}
                    placeholder="至少 6 个字符，我们不会保存它"
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white/45 px-3 py-2 text-sm outline-none focus:border-[var(--bluegrey)]"
                  />
                </label>
                {notice && <p className="text-xs text-[#9a5f4f]">{notice}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--paper)] disabled:opacity-50"
                >
                  {busy ? "正在加密……" : "加密并放进小屋"}
                </button>
              </form>
            ) : revealed ? (
              <div className="space-y-5">
                <div className="rounded-3xl border border-[#dfd1bc] bg-white/45 p-5">
                  <h4 className="font-serif text-xl text-[var(--ink)]">{revealed.title}</h4>
                  <p className="mt-4 whitespace-pre-wrap font-serif text-[15px] leading-[1.9] text-[var(--ink)]/85">
                    {revealed.note}
                  </p>
                  <div className="mt-5 space-y-1 border-t border-[var(--border)] pt-4 text-[11px] text-[var(--quiet)]">
                    {revealed.memoryDate && <p>发生于 {revealed.memoryDate}</p>}
                    {revealed.sharedWith && <p>与 {revealed.sharedWith} 共同记得</p>}
                    {selectedCapsule && <p>本地证明 {selectedCapsule.proof.slice(0, 12)}…</p>}
                  </div>
                </div>
                {anniversaryLabel(revealed.memoryDate) && (
                  <div className="capsule-glow rounded-2xl border border-[#ead8ad] bg-[#fff6d9] px-4 py-3 text-center font-serif text-sm text-[#7b6645]">
                    ✦ {anniversaryLabel(revealed.memoryDate)}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={unlockCapsule} className="space-y-5">
                <p className="text-sm leading-relaxed text-[var(--quiet)]">
                  这段内容只有用创建时的口令才能解密。口令不会离开你的设备。
                </p>
                <label className="block">
                  <span className="text-[11px] text-[var(--quiet)]">打开口令</span>
                  <input
                    autoFocus
                    type="password"
                    value={passphrase}
                    onChange={(event) => setPassphrase(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white/45 px-3 py-3 outline-none focus:border-[var(--bluegrey)]"
                  />
                </label>
                {notice && <p className="text-xs text-[#9a5f4f]">{notice}</p>}
                <button
                  type="submit"
                  disabled={busy || !passphrase}
                  className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm text-[var(--paper)] disabled:opacity-50"
                >
                  {busy ? "正在解密……" : "打开这段记忆"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
