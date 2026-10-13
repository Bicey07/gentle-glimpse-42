import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { JSDOM } from "jsdom";

test("workspace creates cloud pages, retains drafts and supports comments, errors and file drops", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://reverie.example",
    pretendToBeVisual: true,
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    sessionStorage: dom.window.sessionStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { act } = React;
  const original = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    room_id: "room-test",
    title: "共写故事",
    body: "旧正文",
    category: "writing",
    status: "draft",
    version: 1,
    author_id: "a",
    updated_by: "a",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  let doc = { ...original },
    docs = [doc],
    comments: any[] = [],
    failComment = false,
    uploads = 0,
    saveCalls = 0;
  const state = { userId: "a" };
  const api = {
    loadWorkspace: async () => ({
      documents: docs,
      members: [
        { id: "a", name: "作者" },
        { id: "b", name: "朋友" },
      ],
    }),
    loadDocument: async () => ({ document: doc, comments, files: [], versions: [] }),
    saveDocument: async (d: any) => {
      saveCalls++;
      doc = { ...doc, ...d, version: d.version + 1 };
      docs = [doc];
      return doc;
    },
    addComment: async (d: any, body: string) => {
      if (failComment) throw Error("网络断开");
      comments = [
        { id: "c", document_id: d.id, author_id: "a", body, created_at: new Date().toISOString() },
      ];
    },
    uploadDocumentFile: async () => {
      uploads++;
    },
    createInvite: async () => "/invite?token=test",
    loadFiles: async () => [],
    loadDiscussion: async () => ({ comments: [], notes: [] }),
  };
  const Button = ({ children, secondary, ...props }: any) =>
    React.createElement("button", { type: "button", ...props }, children);
  (globalThis as any).__workspace = {
    api,
    useStore: (fn: any) => fn(state),
    session: {},
    useI18n: () => ({ locale: "zh" }),
    JourneyButton: Button,
    fieldClass: "",
  };
  let source = readFileSync("src/components/rooms/RoomWorkspace.tsx", "utf8");
  source = source
    .replace(/import \{ useI18n \}[^\n]+\n/, "")
    .replace(/import \{ session, useStore \}[^\n]+\n/, "")
    .replace(/import \* as api[^\n]+\n/, "")
    .replace(/import \{ JourneyButton[^\n]+\n/, "");
  source = source.replace(
    /([\"'])\.\.\/\.\.\/lib\/workspace\/model\1/,
    JSON.stringify(pathToFileURL(join(process.cwd(), "src/lib/workspace/model.ts")).href),
  );
  source =
    "const {api,useStore,session,useI18n,JourneyButton,fieldClass}=globalThis.__workspace;\n" +
    source;
  const dir = mkdtempSync(join(process.cwd(), ".workspace-test-"));
  const file = join(dir, "component.mjs");
  writeFileSync(
    file,
    ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    }).outputText,
  );
  const root = createRoot(document.querySelector("#root")!);
  try {
    const { RoomWorkspace } = await import(pathToFileURL(file).href);
    await act(async () => {
      root.render(
        React.createElement(RoomWorkspace, {
          room: {
            id: "room-test",
            name: "写作小组",
            description: "",
            presence: "",
            color: "#aabbcc",
          },
        }),
      );
    });
    const text = () => document.body.textContent || "";
    const click = async (label: string) => {
      const el = [...document.querySelectorAll("button")].find((e) => e.textContent === label);
      assert.ok(el, label);
      await act(async () => el.click());
    };
    const input = async (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
      const prototype =
        el.tagName === "TEXTAREA"
          ? dom.window.HTMLTextAreaElement.prototype
          : dom.window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(el, value);
      await act(async () => el.dispatchEvent(new dom.window.Event("input", { bubbles: true })));
    };
    assert.match(text(), /共写故事/);
    const card = [...document.querySelectorAll("button")].find((e) =>
      e.textContent?.includes("共写故事"),
    )!;
    await act(async () => card.click());
    assert.equal(document.querySelector("textarea")!.value, "旧正文");
    await input(document.querySelector("textarea")!, "我的未保存正文");
    assert.match(
      sessionStorage.getItem("reverie:workspace-draft:a:" + doc.id) || "",
      /我的未保存正文/,
    );
    doc = { ...doc, body: "朋友刚更新的正文", version: 2 };
    await act(async () => window.dispatchEvent(new dom.window.Event("focus")));
    assert.equal(
      document.querySelector("textarea")!.value,
      "我的未保存正文",
      "background updates must preserve editor",
    );
    assert.match(text(), /朋友有了新修改/);
    assert.equal(
      [...document.querySelectorAll("button")].find((e) => e.textContent === "保存到小组")!
        .disabled,
      true,
    );
    const comment = document.querySelectorAll("textarea")[1];
    await input(comment, "我喜欢开头");
    failComment = true;
    await act(async () =>
      comment
        .closest("form")!
        .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })),
    );
    assert.equal(comment.value, "我喜欢开头");
    assert.match(text(), /网络断开/);
    failComment = false;
    await act(async () =>
      comment
        .closest("form")!
        .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })),
    );
    assert.match(text(), /我喜欢开头/);
    assert.equal(document.querySelectorAll("textarea")[1].value, "");
    const fileInput = document.querySelector("input[type=file]")!;
    Object.defineProperty(fileInput, "files", {
      value: [new dom.window.File(["pdf"], "notes.pdf", { type: "application/pdf" })],
      configurable: true,
    });
    await act(async () =>
      fileInput.dispatchEvent(new dom.window.Event("change", { bubbles: true })),
    );
    assert.equal(uploads, 1);
    const dropzone = fileInput.closest("label")!.parentElement!;
    const drop = new dom.window.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
      value: { files: [new dom.window.File(["bad"], "script.html", { type: "text/html" })] },
    });
    await act(async () => dropzone.dispatchEvent(drop));
    assert.equal(uploads, 1, "unsupported file never uploaded");
    await click("回到小组 · 草稿保留在此浏览器会话");
    await click("新建页面");
    await input(document.querySelector('input[maxlength="120"]')!, "新的协作页");
    await click("保存到小组");
    assert.equal(saveCalls, 1);
    assert.match(text(), /图片与文档/);
    assert.equal(document.querySelector('input[maxlength="120"]')!.value, "新的协作页");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    rmSync(dir, { recursive: true, force: true });
    delete (globalThis as any).__workspace;
  }
});
