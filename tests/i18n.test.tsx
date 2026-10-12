import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import type { Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import ts from "typescript";
import { LanguageProvider, useI18n } from "../src/lib/i18n/provider";
import {
  LOCALE_STORAGE_KEY,
  translate,
  englishMessages,
  readLocale,
  saveLocale,
  moodLabel,
} from "../src/lib/i18n/core";
import { LanguageSwitcher } from "../src/components/LanguageSwitcher";
import { MemoryRoom } from "../src/components/MemoryRoom";
import { SharedMemories } from "../src/components/rooms/SharedMemories";
import { emptyJourney, joinJourney } from "../src/lib/rooms/model";
import { storageKey } from "../src/lib/rooms/store";

let dom: JSDOM;
let client: typeof import("react-dom/client");
const previous = new Map<string, PropertyDescriptor | undefined>();
before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://quiet-space.test" });
  for (const name of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "Event",
    "MouseEvent",
    "StorageEvent",
    "localStorage",
    "FormData",
    "FileReader",
    "IS_REACT_ACT_ENVIRONMENT",
  ]) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value:
        name === "IS_REACT_ACT_ENVIRONMENT"
          ? true
          : name === "window"
            ? dom.window
            : dom.window[name as keyof Window],
    });
  }
  client = await import("react-dom/client");
});
after(() => {
  dom.window.close();
  for (const [name, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

function Preview() {
  const { t, locale } = useI18n();
  return (
    <>
      <LanguageSwitcher />
      <p data-locale={locale}>{t("你的房间")}</p>
    </>
  );
}
async function mount(children: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = client.createRoot(container);
  await act(async () => root.render(<LanguageProvider>{children}</LanguageProvider>));
  return { container, root };
}
async function dispose(root: Root, container: HTMLElement) {
  await act(async () => root.unmount());
  container.remove();
}
async function click(container: HTMLElement, label: string) {
  const button = [...container.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === label,
  );
  assert.ok(button, `Missing button: ${label}`);
  await act(async () => button.click());
}
async function fill(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

test("translation keeps Chinese as default and preserves literal interpolation values", () => {
  assert.equal(translate("你的房间", "zh"), "你的房间");
  assert.equal(translate("你的房间", "en"), "Your space");
  assert.equal(translate("new unknown message", "en"), "new unknown message");
  assert.equal(
    translate("{name}的房间", "en", { name: "取消 $& {message}" }),
    "取消 $& {message}’s space",
  );
  assert.equal(
    translate("与 {people} 共同记得", "zh", { people: "青羽 & Lin" }),
    "与 青羽 & Lin 共同记得",
  );
  assert.equal(
    moodLabel("在恢复", (s) => translate(s, "en")),
    "Recovering",
  );
  assert.equal(
    moodLabel("今天慢慢走，取消计划也很好", (s) => translate(s, "en")),
    "今天慢慢走，取消计划也很好",
  );
});

test("dynamic errors and counters translate without translating user payloads", () => {
  assert.equal(
    translate("没能放进去：写一下书名吧。", "en"),
    "Could not save it: Add the book's title.",
  );
  assert.equal(translate("距离下一次纪念日还有 18 天", "en"), "18 days until the next anniversary");
  assert.equal(translate("在读《夜航西飞》", "en"), "Reading 《夜航西飞》");
  assert.equal(translate("这周想做：取消", "en"), "Hoping to do this week: 取消");
});

test("invalid and unavailable storage fall back safely", () => {
  assert.equal(readLocale(), "zh");
  assert.equal(readLocale({ getItem: () => "fr" }), "zh");
  assert.equal(readLocale({ getItem: () => "en" }), "en");
  assert.equal(
    readLocale({
      getItem: () => {
        throw new Error("blocked");
      },
    }),
    "zh",
  );
  assert.doesNotThrow(() =>
    saveLocale("en", {
      setItem: () => {
        throw new Error("quota");
      },
    }),
  );
});

test("all static UI translation keys exist and all placeholders survive translation", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
    );
  let count = 0;
  for (const file of [...walk("src/components"), ...walk("src/routes")].filter((path) =>
    path.endsWith(".tsx"),
  )) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ["t", "tx"].includes(node.expression.getText(source)) &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const key = node.arguments[0].text;
        assert.ok(englishMessages[key], `${file}: Missing English translation for ${key}`);
        count++;
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.ok(count > 300);
  const parameters = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();
  for (const [key, value] of Object.entries(englishMessages))
    assert.deepEqual(parameters(value), parameters(key), key);
});

test("language controls switch immediately, persist across mounts, and sync between tabs", async () => {
  localStorage.clear();
  let view = await mount(<Preview />);
  assert.match(view.container.textContent!, /你的房间/);
  await click(view.container, "English");
  assert.match(view.container.textContent!, /Your space/);
  assert.equal(
    view.container.querySelector('button[lang="en"]')?.getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(localStorage.getItem(LOCALE_STORAGE_KEY), "en");
  await dispose(view.root, view.container);
  view = await mount(<Preview />);
  assert.match(view.container.textContent!, /Your space/);
  await act(async () =>
    window.dispatchEvent(new StorageEvent("storage", { key: LOCALE_STORAGE_KEY, newValue: "zh" })),
  );
  assert.match(view.container.textContent!, /你的房间/);
  await click(view.container, "English");
  await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: null })));
  assert.match(view.container.textContent!, /你的房间/);
  await dispose(view.root, view.container);
});

test("saved English preference hydrates Chinese SSR without a mismatch", async () => {
  localStorage.setItem(LOCALE_STORAGE_KEY, "en");
  const element = (
    <LanguageProvider>
      <Preview />
    </LanguageProvider>
  );
  const markup = renderToString(element);
  assert.match(markup, /你的房间/);
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  const errors: unknown[] = [];
  let root!: Root;
  await act(async () => {
    root = client.hydrateRoot(container, element, {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  assert.deepEqual(errors, []);
  assert.match(container.textContent!, /Your space/);
  await dispose(root, container);
});

test("memory capsule draft survives switching both languages", async () => {
  localStorage.clear();
  const view = await mount(
    <>
      <LanguageSwitcher />
      <MemoryRoom name="青羽" />
    </>,
  );
  await click(view.container, "封存记忆");
  const input = view.container.querySelector<HTMLInputElement>(
    'input[placeholder="那天下午的风"]',
  )!;
  const text = "取消 & keep my words";
  await fill(input, text);
  await click(view.container, "English");
  assert.equal(
    view.container.querySelector('input[placeholder="The breeze that afternoon"]'),
    input,
  );
  assert.equal(input.value, text);
  assert.match(view.container.textContent!, /Encrypt and bring it into my room/);
  await click(view.container, "中文");
  assert.equal(input.value, text);
  await dispose(view.root, view.container);
});

test("shared-memory forms and saved content survive a language change", async () => {
  localStorage.clear();
  const scope = "language-test";
  const room = { id: "language-room", name: "取消", description: "一起看展", color: "#B8C9B0" };
  localStorage.setItem(storageKey(scope), JSON.stringify(joinJourney(emptyJourney, room)));
  const view = await mount(
    <>
      <LanguageSwitcher />
      <SharedMemories room={room} scope={scope} wallet="" />
    </>,
  );
  await click(view.container, "留下一段共同记忆");
  const title = view.container.querySelector<HTMLInputElement>('input[name="title"]')!;
  await fill(title, "取消");
  await fill(view.container.querySelector<HTMLInputElement>('input[name="date"]')!, "2026-10-12");
  await fill(view.container.querySelector<HTMLInputElement>('input[name="location"]')!, "美术馆");
  await fill(view.container.querySelector<HTMLInputElement>('input[name="people"]')!, "青羽");
  await fill(view.container.querySelector<HTMLTextAreaElement>('textarea[name="note"]')!, "取消");
  const before = localStorage.getItem(storageKey(scope));
  await click(view.container, "English");
  assert.equal(title.value, "取消");
  assert.equal(localStorage.getItem(storageKey(scope)), before);
  await act(async () =>
    view.container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  // SHA-256 uses Web Crypto asynchronously; let the persisted result arrive.
  for (let i = 0; i < 30 && !view.container.querySelector("article"); i++)
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  assert.equal(view.container.querySelector("article h3")?.textContent, "取消");
  assert.match(
    view.container.querySelector('[role="status"]')!.textContent!,
    /Saved in this browser/,
  );
  const saved = localStorage.getItem(storageKey(scope))!;
  assert.equal(JSON.parse(saved).memories[0].note, "取消");
  await click(view.container, "中文");
  assert.match(view.container.querySelector('[role="status"]')!.textContent!, /已经留在当前浏览器/);
  assert.equal(localStorage.getItem(storageKey(scope)), saved);
  await dispose(view.root, view.container);
});
