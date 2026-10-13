import { DoorInboxProvider } from "../components/DoorInbox";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { LanguageProvider, useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import appCss from "../styles.css?url";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { session } from "../lib/store";

function NotFoundComponent() {
  const { t: tx } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <LanguageSwitcher />
        </div>
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{tx("此页面不存在")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tx("找不到你要访问的页面。")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tx("回到首页")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const { t: tx } = useI18n();
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {tx("页面未能加载")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tx("加载时出了点问题。请再试一次，或回到首页。")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tx("再试一次")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tx("回到首页")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#6f8374" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Reverie" },
      { title: "Reverie · 安静的生活记录" },
      { name: "description", content: "一个没有点赞、没有比较的生活记录空间。" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Reverie · 安静的生活记录" },
      { property: "og:description", content: "一个没有点赞、没有比较的生活记录空间。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Reverie · 安静的生活记录" },
      { name: "twitter:description", content: "一个没有点赞、没有比较的生活记录空间。" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/904a6a21-4e2d-424c-b23f-0c9403c27988/id-preview-1f3ee3f9--2cc86ce0-6410-480b-9751-7fc49dd77582.lovable.app-1778919846839.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/904a6a21-4e2d-424c-b23f-0c9403c27988/id-preview-1f3ee3f9--2cc86ce0-6410-480b-9751-7fc49dd77582.lovable.app-1778919846839.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icons/quiet-space.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/quiet-space-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Noto+Serif+SC:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LocalizedDocument>{children}</LocalizedDocument>
    </LanguageProvider>
  );
}

function LocalizedDocument({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return (
    <html lang={locale === "en" ? "en" : "zh-CN"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LocalizedMetadata />
      <PwaRegistration />
      <AuthSync />
      <DoorInboxProvider><Outlet /></DoorInboxProvider>
    </QueryClientProvider>
  );
}

// Single auth listener: guests see the mock demo, signed-in users see Cloud data.
function AuthSync() {
  useEffect(() => {
    // Keep the public guest demo usable when Cloud client variables have not
    // been exposed to the browser build yet.
    if (!isSupabaseConfigured()) return;

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) session.setUser(data.session?.user ?? null);
      })
      .catch(() => {
        // Authentication is optional for guests; stay in demo mode on failure.
      });

    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED" &&
        event !== "INITIAL_SESSION"
      )
        return;
      session.setUser(s?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return null;
}

function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The app still works normally if registration is unavailable.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

function LocalizedMetadata() {
  const { t: tx } = useI18n();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    document.title = tx(
      pathname === "/auth" ? "登录 · Reverie" : "Reverie · 安静的生活记录",
    );
    const description = tx(
      pathname === "/auth"
        ? "用邮箱登录，开始在自己的房间里留下生活痕迹。"
        : "一个没有点赞、没有比较的生活记录空间。",
    );
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [pathname, tx]);
  return null;
}
