import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { loadFriendInbox, acceptFriend, type FriendRequest } from "../lib/cloud";
import { session, useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";

type Inbox = {
  requests: FriendRequest[]; loading: boolean; error: string; busy: string;
  message: string; sound: boolean; refresh: () => void;
  open: (id: string) => Promise<void>; toggleSound: () => Promise<void>;
};
const Context = createContext<Inbox | null>(null);

export function DoorInboxProvider({ children }: { children: ReactNode }) {
  const userId = useStore(s => s.userId);
  return <AccountInbox key={userId || "guest"} userId={userId}>{children}</AccountInbox>;
}

function AccountInbox({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const enabled = useRef(false);
  const alive = useRef(true);
  const accepted = useRef(new Set<string>());
  const opening = useRef(false);
  const refresh = useRef<() => void>(() => {});
  const knock = () => {
    const ctx = audio.current;
    if (!enabled.current || !ctx || ctx.state !== "running") return;
    // Two soft wooden knocks, synthesized locally; no audio download.
    [0, .18].forEach(delay => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(240, start);
      oscillator.frequency.exponentialRampToValueAtTime(85, start + .09);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.22, start + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .13);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(start); oscillator.stop(start + .14);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  };
  const ring = useRef(knock);
  ring.current = knock;

  useEffect(() => {
    alive.current = true;
    let cancelled = false, running = false;
    let seen: Set<string> | null = null;
    const poll = async () => {
      if (!userId || cancelled || running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const rows = (await loadFriendInbox(userId)).filter(r => !accepted.current.has(r.id));
        if (cancelled) return;
        if (seen && rows.some(r => !seen!.has(r.id))) ring.current();
        if (!seen) seen = new Set();
        rows.forEach(r => seen!.add(r.id));
        setRequests(rows); setError("");
      } catch {
        if (!cancelled) setError("暂时没能查看门外，点一下刷新试试。");
      } finally {
        running = false;
        if (!cancelled) setLoading(false);
      }
    };
    refresh.current = () => { void poll(); };
    void poll();
    const timer = window.setInterval(poll, 15000);
    const wake = () => { void poll(); };
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelled = true; alive.current = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", wake);
      if (audio.current) void audio.current.close();
      audio.current = null; enabled.current = false;
    };
  }, [userId]);

  const open = async (id: string) => {
    if (opening.current || !userId) return;
    opening.current = true; setBusy(id); setMessage("");
    try {
      await acceptFriend(id);
      if (!alive.current) return;
      accepted.current.add(id);
      setRequests(rows => rows.filter(r => r.id !== id));
      setMessage("门开啦，你们已经是邻居了。到好友页看看 TA 的房间吧。");
      void session.refresh();
    } catch (cause) {
      if (alive.current) setMessage(cause instanceof Error ? cause.message : "没能开门，请再试一次。");
    } finally {
      opening.current = false;
      if (alive.current) { setBusy(""); refresh.current(); }
    }
  };
  const toggleSound = async () => {
    if (enabled.current) { enabled.current = false; setSound(false); return; }
    try {
      const ctx = audio.current || new AudioContext();
      audio.current = ctx;
      await ctx.resume();
      if (!alive.current) return;
      enabled.current = true; setSound(true); ring.current();
    } catch { setMessage("浏览器暂时无法播放声音，门口提示仍然会显示。"); }
  };
  return <Context.Provider value={{ requests, loading, error, busy, message, sound,
    refresh: () => refresh.current(), open, toggleSound }}>{children}</Context.Provider>;
}

export function DoorInbox() {
  const inbox = useContext(Context);
  const userId = useStore(s => s.userId);
  const { locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const en = locale === "en";
  if (!inbox || !userId) return null;
  const { requests, loading, error, busy, message, sound } = inbox;
  const visible = expanded || requests.length > 0 || Boolean(error || message);
  return <section aria-label={en ? "Doorstep mailbox" : "门口的小信箱"}
    className="my-5 overflow-hidden rounded-[22px] border border-[#dccbd1] bg-gradient-to-r from-[#f9e9ee] via-[#fff8f5] to-[#e7f0fa] text-[var(--ink)]">
    <div className="flex items-center gap-3 p-4">
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={visible}
        aria-label={en ? "Open mailbox" : "查看门口信箱"} className="relative shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2">
        <svg width="68" height="82" viewBox="0 0 68 82" fill="none" aria-hidden="true">
          <path d="M5 79V29Q5 3 32 3Q59 3 59 29V79" fill="#d3e4f1" stroke="#8a93a7"/>
          <path d="M13 77V29Q13 12 32 12Q51 12 51 29V77" fill="#f4d5db" stroke="#b39ba8"/>
          <path d="M20 29H44M20 35H44M32 17V35" stroke="#c1a9b6"/>
          <circle cx="43" cy="51" r="3" fill="#b29b78"/>
          <rect x="1" y="52" width="24" height="20" rx="4" fill="#efbaa9" stroke="#b58f89"/>
          <path d="M5 57H21M7 63H19" stroke="#fff8f5" strokeWidth="2"/>
          {requests.length > 0 && <path d="M7 52V42H21V55L14 51Z" fill="#fffaf4" stroke="#b58f89"/>}
          <path d="M1 79H65" stroke="#b39ba8" strokeWidth="2"/>
        </svg>
        {requests.length > 0 && <span className="absolute -right-1 top-0 rounded-full bg-[#b26672] px-2 text-xs text-white">{requests.length}</span>}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-[.2em] text-[var(--quiet)]">{en ? "AT YOUR DOOR" : "走廊 · 小信箱"}</p>
        <p role="status" className="mt-1 font-serif text-sm">{requests.length ? (en ? "A new neighbour is knocking" : "笃笃，有新邻居来敲门") : loading ? (en ? "Checking the door…" : "正在看看门外…") : (en ? "Waiting for a little hello" : "等一声轻轻的问候")}</p>
        <button type="button" aria-pressed={sound} onClick={() => void inbox.toggleSound()} className="mt-2 rounded-full border border-[#c9c7d4] px-3 py-1 text-[11px]">
          {sound ? (en ? "Sound on · mute" : "敲门声已开 · 静音") : (en ? "Enable knock sound" : "开启敲门声")}
        </button>
      </div>
      <button type="button" onClick={inbox.refresh} className="shrink-0 rounded-full border border-[#c9c7d4] px-3 py-2 text-xs">{en ? "Refresh" : "刷新"}</button>
    </div>
    {visible && <div className="space-y-3 border-t border-[#e3d6dc] px-4 py-3">
      {requests.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/60 p-3">
        <div className="min-w-0 flex-1"><p className="break-words font-serif text-sm">{request.fromName}{en ? " is moving in next door!" : "搬来隔壁啦！"}</p>
          <p className="mt-1 text-xs text-[var(--quiet)]">{en ? "Open the door to become friends." : "给 TA 开门，就能串门看看彼此的日常。"}</p></div>
        <button type="button" disabled={Boolean(busy)} onClick={() => void inbox.open(request.id)} className="rounded-full border border-[#b79095] bg-[#f2cfc5] px-4 py-2 text-xs disabled:opacity-50">{busy === request.id ? (en ? "Opening…" : "正在开门…") : (en ? "Open the door" : "给 TA 开门")}</button>
      </div>)}
      {error && <p role="alert" className="text-xs">{en ? "Could not check the door. Please refresh." : error}</p>}
      {message && <p role="status" className="text-xs">{message}</p>}
      {!requests.length && !error && !message && <p className="text-xs text-[var(--quiet)]">{en ? "No unanswered knocks. Share your friend code from Friends." : "暂时没有待回应的敲门。去好友页把好友码分享给朋友吧。"}</p>}
      <p className="text-[10px] text-[var(--quiet)]">{en ? "Checks every 15 seconds while this page is visible." : "页面打开时，每 15 秒看看门外。"}</p>
    </div>}
  </section>;
}
