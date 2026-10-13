import { DoorInbox } from "./DoorInbox";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BottomNav } from "./BottomNav";
import { useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";

export function PageShell({ children }: { children: ReactNode }) {
  const mode = useStore((state) => state.mode);
  const { t: tx } = useI18n();
  return (
    <div className="reverie-shell min-h-screen text-[var(--ink)]">
      <div className="reverie-page mx-auto px-6 pb-28 pt-5">
        <div className="reverie-topbar mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="reverie-wordmark" aria-label={tx("空间")}>
            <span className="reverie-seal" aria-hidden="true">栖</span>
            <span>REVERIE<small>A LITTLE ROOM FOR LIFE</small></span>
          </Link>
          <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--quiet)] hover:text-[var(--ink)]"
          >
            {mode === "cloud" ? tx("账户") : tx("登录 / 注册")}
          </Link>
          <LanguageSwitcher />
          </div>
        </div>
        <div className="reverie-art" aria-hidden="true">
          <svg viewBox="0 0 720 200" fill="none" preserveAspectRatio="xMidYMid slice">
            <circle cx="543" cy="77" r="44" fill="#fff8ed" opacity=".94" />
            <path d="M0 168 Q140 112 288 162 T720 144 V200 H0Z" fill="#a9c6e0" opacity=".6" />
            <path d="M0 190 Q220 145 410 183 T720 167" stroke="#b9a5b5" strokeWidth=".6" />
            <path d="M0 180 Q130 140 320 178 T720 157" stroke="#b9a5b5" strokeWidth=".6" opacity=".5" />
            <g stroke="#a5b6c7" strokeWidth="1.2">
              <path d="M720 8 Q650 42 598 11 M683 25 Q663 77 630 103 M660 38 Q608 59 582 48" />
              <path d="M664 50 Q646 38 642 25 Q666 31 664 50Z M651 74 Q624 70 615 58 Q641 56 651 74Z M633 100 Q634 76 644 67 Q651 90 633 100Z M610 54 Q596 31 583 30 Q585 47 610 54Z" fill="#c3d8e5" />
            </g>
            <g stroke="#bb9eae" strokeWidth="1">
              <path d="M608 32 V76 M608 76 Q592 80 596 99 L590 111 Q608 118 626 111 L620 99 Q624 80 608 76Z" fill="#edc0b6" />
              <path d="M608 116 V151 M602 151 H614 M608 151 V177" />
            </g>
            <g fill="#fff8ed"><circle cx="456" cy="35" r="1.5"/><circle cx="489" cy="123" r="1"/><circle cx="362" cy="71" r="1"/></g>
          </svg>
          <div className="reverie-art-caption"><span>日常 · 收藏</span><small>THE ART OF SLOW LIVING</small></div>
        </div>
        <DoorInbox />
        <main id="main-content" className="reverie-content">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
