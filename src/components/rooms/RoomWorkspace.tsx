import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  ImagePlus,
  MessageCircle,
  Plus,
  Search,
  Upload,
  Users,
  X,
  History,
  ArrowLeft,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { session, useStore } from "../../lib/store";
import * as api from "../../lib/workspace/api";
import {
  categories,
  statuses,
  documentSchema,
  errorMessage,
  filterDocuments,
  fileAccept,
  validateFile,
  type RoomDocument,
  type DocumentInput,
  type DocumentFile,
  type WorkspaceMember,
} from "../../lib/workspace/model";
import type { Room } from "../../lib/types";
import { JourneyButton, fieldClass } from "./JourneyUi";

const categoryLabels = {
  writing: "写作",
  reading: "阅读",
  film: "电影",
  inspiration: "灵感",
  meeting: "会议",
};
const statusLabels = { draft: "草稿", discussion: "待讨论", finished: "已完成" };
const templates = {
  writing: { title: "新的写作", body: "主题 / 想写的事\n\n正文\n\n想听听大家的意见\n" },
  reading: { title: "一起读一本书", body: "书名与作者\n\n喜欢的段落\n\n我的想法\n\n一起讨论\n" },
  film: { title: "一起看一部电影", body: "片名与导演\n\n印象深刻的镜头\n\n观后感\n\n一起讨论\n" },
  inspiration: { title: "收集一颗灵感", body: "灵感来自哪里\n\n想法\n\n可以一起尝试的事\n" },
  meeting: {
    title: "小组碰头",
    body: "时间 / 地点\n\n这次聊什么\n\n讨论记录\n\n接下来做什么 / 谁来做\n",
  },
};
const stamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function RoomWorkspace({ room }: { room: Room }) {
  const userId = useStore((s) => s.userId);
  if (!userId) return null;
  return <Workspace key={`${userId}:${room.id}`} room={room} userId={userId} />;
}
function Workspace({ room, userId }: { room: Room; userId: string }) {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof api.loadWorkspace>>>({
    documents: [],
    members: [],
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState<DocumentInput | null>(null);
  const [tab, setTab] = useState<"pages" | "files" | "discussion">("pages");
  const [invite, setInvite] = useState(""),
    [inviting, setInviting] = useState(false),
    [notice, setNotice] = useState("");
  const [copyBusy, setCopyBusy] = useState(false);
  const live = useRef(true),
    seq = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++seq.current;
    try {
      const data = await api.loadWorkspace(room.id);
      if (live.current && request === seq.current) {
        setSnapshot(data);
        setError("");
      }
    } catch (e) {
      if (live.current && request === seq.current) setError(errorMessage(e));
    } finally {
      if (live.current && request === seq.current) setLoading(false);
    }
  }, [room.id]);
  useEffect(() => {
    live.current = true;
    void refresh();
    const wake = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(wake, 15000);
    window.addEventListener("focus", wake);
    return () => {
      live.current = false;
      seq.current++;
      clearInterval(timer);
      window.removeEventListener("focus", wake);
    };
  }, [refresh]);
  const start = (kind: DocumentInput["category"]) => {
    setCreating({
      id: crypto.randomUUID(),
      room_id: room.id,
      ...templates[kind],
      category: kind,
      status: "draft",
      version: 0,
    });
  };
  const docs = filterDocuments(snapshot.documents, query, category);
  if (selected || creating)
    return (
      <DocumentEditor
        key={selected || "new"}
        id={selected}
        initial={creating}
        userId={userId}
        members={snapshot.members}
        onBack={() => {
          setSelected(null);
          setCreating(null);
          void refresh();
        }}
        onSaved={(doc) => {
          setCreating(null);
          setSelected(doc.id);
          void refresh();
        }}
      />
    );
  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border border-[#decfd9] bg-gradient-to-br from-[#fbeaf0] to-[#e8f1fb] p-5 sm:p-7">
        <p className="text-[10px] tracking-[.25em] text-[var(--quiet)]">OUR LITTLE WORKSPACE</p>
        <h2 className="mt-2 font-serif text-xl">一张桌子，留给我们一起创作。</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--quiet)]">
          写下想法，放好资料，在彼此的文字下面留下回应。小组内容只有成员可见。
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs">
            <Users size={14} />
            {snapshot.members.length} 位成员
          </span>
          {snapshot.members.map((m) => (
            <span
              key={m.id}
              className="max-w-40 truncate rounded-full bg-white/60 px-3 py-1 text-xs"
            >
              {m.name}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <JourneyButton
            disabled={inviting}
            secondary
            onClick={async () => {
              setInviting(true);
              setNotice("");
              try {
                const url = await api.createInvite(room.id, userId);
                if (live.current) setInvite(url);
              } catch (e) {
                if (live.current) setNotice(errorMessage(e));
              } finally {
                if (live.current) setInviting(false);
              }
            }}
          >
            {inviting ? "正在准备邀请…" : "邀请朋友加入"}
          </JourneyButton>
          <JourneyButton secondary onClick={() => void refresh()}>
            刷新
          </JourneyButton>
        </div>
        {invite && (
          <div className="mt-4 space-y-2">
            <label className="block text-xs">
              邀请链接 · 14 天有效
              <input
                readOnly
                value={invite}
                className={fieldClass}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <JourneyButton
              secondary
              disabled={copyBusy}
              onClick={async () => {
                setCopyBusy(true);
                try {
                  await navigator.clipboard.writeText(invite);
                  setNotice("邀请已复制，可以发给朋友。");
                } catch {
                  setNotice("请选中上面的链接，手动复制。");
                } finally {
                  setCopyBusy(false);
                }
              }}
            >
              复制邀请
            </JourneyButton>
            <p className="text-xs text-[var(--quiet)]">
              持有链接的人登录后即可加入，请只发给想邀请的朋友。
            </p>
          </div>
        )}
        {notice && (
          <p role="status" className="mt-3 text-xs">
            {notice}
          </p>
        )}
      </div>
      {error && (
        <div role="alert" className="rounded-xl border border-[#dfb6af] p-4 text-sm">
          {error}
          <button className="ml-3 underline" onClick={() => void refresh()}>
            重试
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="小组内容">
        {(
          [
            ["pages", "共写页面", FileText],
            ["files", "资料库", Upload],
            ["discussion", "讨论", MessageCircle],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${tab === value ? "border-[#b99bab] bg-[#f5dfe7]" : "border-[var(--border)] bg-[var(--card)]"}`}
            onClick={() => setTab(value)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <p role="status" className="py-10 text-center text-sm">
          正在打开小组桌面…
        </p>
      ) : (
        <>
          {tab === "pages" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-lg">从一页开始</h3>
                <JourneyButton disabled={Boolean(error)} onClick={() => start("writing")}>
                  <Plus size={14} />
                  新建页面
                </JourneyButton>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {categories.map((kind) => (
                  <button
                    disabled={Boolean(error)}
                    key={kind}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-left text-xs disabled:opacity-50"
                    onClick={() => start(kind)}
                  >
                    <span className="block font-serif text-base">{categoryLabels[kind]}</span>
                    <span className="mt-1 block text-[var(--quiet)]">用这个模板 ↗</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] px-3">
                  <Search size={15} />
                  <input
                    aria-label="搜索小组页面"
                    placeholder="搜索标题和正文"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  />
                </label>
                <select
                  aria-label="按主题筛选"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs"
                >
                  <option value="all">全部主题</option>
                  {categories.map((k) => (
                    <option key={k} value={k}>
                      {categoryLabels[k]}
                    </option>
                  ))}
                </select>
              </div>
              {!docs.length && !error && (
                <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--quiet)]">
                  {query || category !== "all"
                    ? "没有找到符合条件的页面。"
                    : "还没有页面。写一篇开场白，邀请朋友一起续写吧。"}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {docs.map((d) => (
                  <button
                    key={d.id}
                    className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 text-left hover:bg-[#f8edf1]"
                    onClick={() => setSelected(d.id)}
                  >
                    <span className="text-[10px] text-[var(--quiet)]">
                      {categoryLabels[d.category]} · {statusLabels[d.status]}
                    </span>
                    <h4 className="mt-2 break-words font-serif text-lg">{d.title}</h4>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--quiet)]">
                      {d.body || "一张等待填写的纸。"}
                    </p>
                    <p className="mt-4 text-[10px] text-[var(--quiet)]">
                      {snapshot.members.find((m) => m.id === d.updated_by)?.name || "成员"} ·{" "}
                      {stamp(d.updated_at)} 更新
                    </p>
                  </button>
                ))}
              </div>
              {snapshot.documents.length >= 500 && (
                <p className="text-xs">显示最近更新的 500 个页面。</p>
              )}
            </>
          )}
          {tab === "files" && <RoomFiles documents={snapshot.documents} onOpen={setSelected} />}
          {tab === "discussion" && (
            <RoomDiscussion
              roomId={room.id}
              userId={userId}
              members={snapshot.members}
              documents={snapshot.documents}
              onOpen={setSelected}
            />
          )}
        </>
      )}
    </section>
  );
}

function DocumentEditor({
  id,
  initial,
  userId,
  members,
  onBack,
  onSaved,
}: {
  id: string | null;
  initial: DocumentInput | null;
  userId: string;
  members: WorkspaceMember[];
  onBack: () => void;
  onSaved: (d: RoomDocument) => void;
}) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof api.loadDocument>> | null>(null);
  const [draft, setDraft] = useState<DocumentInput | null>(initial);
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id)),
    [recovered, setRecovered] = useState(false),
    [history, setHistory] = useState(false);
  const [comment, setComment] = useState(""),
    [commentBusy, setCommentBusy] = useState(false),
    [commentError, setCommentError] = useState("");
  const [uploading, setUploading] = useState(false),
    [uploadMessage, setUploadMessage] = useState(""),
    [drag, setDrag] = useState(false);
  const mounted = useRef(true),
    saving = useRef(false),
    uploadLock = useRef(false),
    commentLock = useRef(false);
  const commentId = useRef(crypto.randomUUID());
  const draftKey = `reverie:workspace-draft:${userId}:${id || initial?.room_id + ":new"}`;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const sequence = useRef(0);
  const poll = useCallback(async () => {
    if (!id) return;
    const n = ++sequence.current;
    try {
      const next = await api.loadDocument(id);
      if (mounted.current && n === sequence.current) {
        setDetail(next);
        setError("");
        if (!dirtyRef.current && !saving.current) setDraft(next.document);
      }
    } catch (e) {
      if (mounted.current && n === sequence.current) setError(errorMessage(e));
    } finally {
      if (mounted.current && n === sequence.current) setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    mounted.current = true;
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const value = documentSchema.parse(JSON.parse(saved));
        if (
          value &&
          typeof value.title === "string" &&
          typeof value.body === "string" &&
          (id ? value.id === id : value.room_id === initial?.room_id)
        ) {
          setDraft(value);
          setDirty(true);
          dirtyRef.current = true;
          setRecovered(true);
        }
      }
    } catch {
      /* Keep server usable when browser storage is disabled. */
    }
    void poll();
    const refresh = () => {
      if (document.visibilityState === "visible") void poll();
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    const unload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      mounted.current = false;
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("beforeunload", unload);
    };
  }, [poll, draftKey]);
  const change = (patch: Partial<DocumentInput>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    setDirty(true);
    dirtyRef.current = true;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      setError("浏览器无法暂存草稿，请及时保存或复制正文。");
    }
  };
  const refreshDraft = async () => {
    // Explicit action; never reset unsaved text during background polling.
    if (
      dirtyRef.current &&
      !window.confirm("读取最新版本会替换当前未保存文字。请先复制保留，确定继续吗？")
    )
      return;
    dirtyRef.current = false;
    setDirty(false);
    setRecovered(false);
    try {
      sessionStorage.removeItem(draftKey);
    } catch {}
    await poll();
  };
  const save = async () => {
    if (!draft || saving.current) return;
    saving.current = true;
    sequence.current++;
    setBusy(true);
    setError("");
    try {
      const doc = await api.saveDocument(draft, userId);
      if (!mounted.current) return;
      dirtyRef.current = false;
      setDirty(false);
      setDraft(doc);
      setRecovered(false);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
      onSaved(doc);
      await poll();
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const upload = async (files: File[]) => {
    if (!detail || uploadLock.current) return;
    if (files.length > 10) {
      setUploadMessage("一次最多上传 10 个文件。");
      return;
    }
    try {
      files.forEach(validateFile);
    } catch (e) {
      setUploadMessage(errorMessage(e));
      return;
    }
    uploadLock.current = true;
    setUploading(true);
    setUploadMessage("");
    let count = 0;
    try {
      for (const file of files) {
        if (!mounted.current) break;
        await api.uploadDocumentFile(detail.document, file, userId);
        count++;
      }
      if (mounted.current) setUploadMessage(`已上传 ${count} 个文件。`);
    } catch (e) {
      if (mounted.current)
        setUploadMessage(`已上传 ${count} 个。${errorMessage(e)} 未成功的文件可以重新选择。`);
    } finally {
      uploadLock.current = false;
      if (mounted.current) {
        setUploading(false);
        void poll();
      }
    }
  };
  if (loading && !draft)
    return (
      <p role="status" className="p-8">
        正在打开页面…
      </p>
    );
  if (!draft)
    return (
      <div role="alert">
        {error || "页面暂时无法打开。"}
        <button className="ml-3 underline" onClick={onBack}>
          回到小组
        </button>
      </div>
    );
  const conflict = detail && draft.version > 0 && detail.document.version > draft.version;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          disabled={busy || uploading || commentBusy}
          className="inline-flex items-center gap-1 text-xs disabled:opacity-50"
          onClick={onBack}
        >
          <ArrowLeft size={14} />
          回到小组 · 草稿保留在此浏览器会话
        </button>
        <span className="text-[10px] text-[var(--quiet)]">
          {dirty ? "尚未保存" : id ? "已保存到小组" : "新页面"}
        </span>
      </div>
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
        {recovered && (
          <p role="status" className="mb-4 text-xs">
            已恢复你上次未保存的草稿。
          </p>
        )}
        <label className="block text-xs text-[var(--quiet)]">
          页面标题
          <input
            disabled={busy}
            maxLength={120}
            value={draft.title}
            onChange={(e) => change({ title: e.target.value })}
            className={`${fieldClass} font-serif text-xl`}
            placeholder="给这页起个名字"
          />
        </label>
        <div className="my-4 flex flex-wrap gap-3">
          <label className="text-xs">
            主题{" "}
            <select
              disabled={busy}
              value={draft.category}
              onChange={(e) => change({ category: e.target.value as DocumentInput["category"] })}
              className="rounded-lg border border-[var(--border)] bg-transparent p-2"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            进度{" "}
            <select
              disabled={busy}
              value={draft.status}
              onChange={(e) => change({ status: e.target.value as DocumentInput["status"] })}
              className="rounded-lg border border-[var(--border)] bg-transparent p-2"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs text-[var(--quiet)]">
          正文 · 所有小组成员都可以编辑
          <textarea
            disabled={busy}
            value={draft.body}
            maxLength={100000}
            onChange={(e) => change({ body: e.target.value })}
            rows={16}
            className={`${fieldClass} resize-y font-serif text-base leading-8`}
            placeholder="把想写的故事放在这里。"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] text-[var(--quiet)]">
            {draft.body.length} 字 · v{draft.version} · 每次保存保留历史
          </span>
          <JourneyButton
            disabled={busy || !draft.title.trim() || Boolean(conflict)}
            onClick={() => void save()}
          >
            {busy ? "正在保存…" : "保存到小组"}
          </JourneyButton>
        </div>
        {(error || conflict) && (
          <div role="alert" className="mt-4 rounded-xl bg-[#f8e2db] p-3 text-xs">
            {conflict ? "朋友有了新修改，你的文字已保留。请复制后读取最新版本再合并。" : error}
            {id && (
              <button className="ml-2 underline" onClick={() => void refreshDraft()}>
                读取最新版本
              </button>
            )}
          </div>
        )}
      </div>
      {detail && (
        <>
          <section className="rounded-[22px] border border-[var(--border)] p-5">
            <h3 className="mb-3 flex items-center gap-2 font-serif text-lg">
              <ImagePlus size={18} />
              图片与文档
            </h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                if (e.dataTransfer.files.length) void upload(Array.from(e.dataTransfer.files));
                else setUploadMessage("这里接受本地文件。网页图片请先下载，再上传。");
              }}
              className={`rounded-xl border border-dashed p-5 text-center ${drag ? "border-[#ae859b] bg-[#f9e5ed]" : "border-[var(--border)] bg-[#eef4fa]"}`}
            >
              <Upload size={23} className="mx-auto mb-2" />
              <p className="text-sm">
                {uploading ? "正在上传，请保持页面打开…" : "把图片或文档拖到这里"}
              </p>
              <label className="mt-3 inline-block cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-xs">
                选择本地文件
                <input
                  aria-label="上传小组附件"
                  type="file"
                  className="sr-only"
                  accept={fileAccept}
                  multiple
                  disabled={uploading}
                  onChange={(e) => {
                    void upload(Array.from(e.target.files || []));
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="mt-2 text-[10px] text-[var(--quiet)]">
                图片、PDF、Word、TXT、Markdown、Excel、PPT、CSV · 每个 20MB 内
              </p>
            </div>
            {uploadMessage && (
              <p role="status" className="mt-3 text-xs">
                {uploadMessage}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {detail.files.map((f) => (
                <FileCard key={f.id} file={f} />
              ))}
            </div>
          </section>
          <section className="rounded-[22px] border border-[var(--border)] p-5">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-lg">
              <MessageCircle size={18} />
              围坐聊聊 · {detail.comments.length} 条评论
            </h3>
            <ul className="space-y-3">
              {detail.comments.map((c) => (
                <li key={c.id} className="rounded-xl bg-[#eef3f9] p-4">
                  <p className="text-[10px] text-[var(--quiet)]">
                    {members.find((m) => m.id === c.author_id)?.name || "小组成员"} ·{" "}
                    {stamp(c.created_at)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{c.body}</p>
                </li>
              ))}
            </ul>
            {!detail.comments.length && (
              <p className="mb-4 text-sm text-[var(--quiet)]">
                第一条回应，可以从“我喜欢这一段”开始。
              </p>
            )}
            {detail.comments.length >= 200 && <p className="text-xs">显示最近 200 条评论。</p>}
            <form
              className="mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (commentLock.current || !comment.trim()) return;
                commentLock.current = true;
                setCommentBusy(true);
                setCommentError("");
                try {
                  await api.addComment(detail.document, comment, userId, commentId.current);
                  if (mounted.current) {
                    setComment("");
                    commentId.current = crypto.randomUUID();
                    await poll();
                  }
                } catch (cause) {
                  if (mounted.current) setCommentError(errorMessage(cause));
                } finally {
                  commentLock.current = false;
                  if (mounted.current) setCommentBusy(false);
                }
              }}
            >
              <label className="block text-xs">
                留下回应
                <textarea
                  disabled={commentBusy}
                  rows={3}
                  maxLength={5000}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    commentId.current = crypto.randomUUID();
                  }}
                  className={fieldClass}
                  placeholder="你的感受、建议，或一个问题…"
                />
              </label>
              {commentError && (
                <p role="alert" className="mt-2 text-xs">
                  {commentError}
                </p>
              )}
              <JourneyButton
                className="mt-3"
                type="submit"
                disabled={commentBusy || !comment.trim()}
              >
                {commentBusy ? "正在送出…" : "留下评论"}
              </JourneyButton>
            </form>
          </section>
          <section>
            <button
              className="flex items-center gap-2 text-xs"
              onClick={() => setHistory(!history)}
              aria-expanded={history}
            >
              <History size={15} />
              修改历史 · 最近 20 个版本
            </button>
            {history && (
              <ul className="mt-3 space-y-2">
                {detail.versions.map((v) => (
                  <li key={v.id} className="rounded-xl border border-[var(--border)] p-3">
                    <details>
                      <summary className="cursor-pointer text-xs">
                        v{v.version} · {members.find((m) => m.id === v.editor_id)?.name || "成员"} ·{" "}
                        {stamp(v.created_at)}
                      </summary>
                      <h4 className="mt-3 font-serif">{v.title}</h4>
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-xs leading-6">
                        {v.body}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {!detail && <p className="text-xs text-[var(--quiet)]">先保存页面，就能添加附件和评论。</p>}
    </div>
  );
}

function FileCard({ file }: { file: DocumentFile }) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const image = file.mime.startsWith("image/");
  useEffect(() => {
    let alive = true;
    if (image)
      api
        .fileUrl(file)
        .then((u) => {
          if (alive) {
            setUrl(u);
            setError("");
          }
        })
        .catch(() => {
          if (alive) setError("图片暂时无法加载");
        });
    return () => {
      alive = false;
    };
  }, [file.path, attempt, image]);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
      {image && url && !error && (
        <img
          src={url}
          alt={file.name}
          onError={() => setError("图片链接已过期或无法加载")}
          className="max-h-64 w-full object-contain bg-white/50"
          loading="lazy"
        />
      )}
      <div className="p-3">
        <p className="break-all text-sm">{file.name}</p>
        <p className="mt-1 text-[10px] text-[var(--quiet)]">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
        <button
          className="mt-2 text-xs underline"
          onClick={async () => {
            try {
              const fresh = await api.fileUrl(file, true);
              const a = document.createElement("a");
              a.href = fresh;
              a.rel = "noopener noreferrer";
              a.download = file.name;
              a.click();
              setError("");
            } catch {
              setError("下载失败，请重试。");
            }
          }}
        >
          下载文件
        </button>
        {error && (
          <p role="status" className="mt-2 text-xs">
            {error}{" "}
            {image && (
              <button
                className="underline"
                onClick={() => {
                  setUrl("");
                  setAttempt((n) => n + 1);
                }}
              >
                重试预览
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
function RoomFiles({
  documents,
  onOpen,
}: {
  documents: RoomDocument[];
  onOpen: (id: string) => void;
}) {
  const [files, setFiles] = useState<DocumentFile[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .loadFiles(documents[0]?.room_id, documents.length > 0)
      .then((data) => {
        if (alive) {
          setFiles(data);
          setError("");
        }
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [documents]);
  return (
    <section>
      <h3 className="font-serif text-lg">小组资料库</h3>
      <p className="my-3 text-xs text-[var(--quiet)]">
        附件跟随页面保存。打开对应页面，就能添加资料或讨论。
      </p>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>正在整理资料…</p>
      ) : !files.length ? (
        <p className="p-6 text-sm text-[var(--quiet)]">还没有资料，先在共写页面里上传第一份吧。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {files.map((f) => (
            <div key={f.id}>
              <FileCard file={f} />
              <button onClick={() => onOpen(f.document_id)} className="mt-2 text-xs underline">
                打开页面：{documents.find((d) => d.id === f.document_id)?.title || "查看原文"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
function RoomDiscussion({
  roomId,
  userId,
  members,
  documents,
  onOpen,
}: {
  roomId: string;
  userId: string;
  members: WorkspaceMember[];
  documents: RoomDocument[];
  onOpen: (id: string) => void;
}) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.loadDiscussion>> | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    api
      .loadDiscussion(roomId)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [roomId, documents]);
  return (
    <section>
      <h3 className="mb-4 font-serif text-lg">小组里的声音</h3>
      <p className="mb-4 text-xs text-[var(--quiet)]">
        在每篇页面下发表评论，大家的回应会汇集到这里。
      </p>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>正在查看讨论…</p>}
      {data && (
        <ul className="space-y-3">
          {data.comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-[#eef3f9] p-4">
              <p className="text-xs text-[var(--quiet)]">
                {members.find((m) => m.id === c.author_id)?.name || "成员"} · {stamp(c.created_at)}
              </p>
              <p className="my-2 whitespace-pre-wrap break-words text-sm">{c.body}</p>
              <button className="text-xs underline" onClick={() => onOpen(c.document_id)}>
                在「{documents.find((d) => d.id === c.document_id)?.title || "页面"}」继续讨论 →
              </button>
            </li>
          ))}
          {data.notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--quiet)]">
                原来的小组纸条 · {members.find((m) => m.id === n.user_id)?.name || "成员"} ·{" "}
                {stamp(n.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{n.text}</p>
            </li>
          ))}
          {!data.comments.length && !data.notes.length && (
            <li className="text-sm text-[var(--quiet)]">还没有讨论，去一篇页面下留句话吧。</li>
          )}
        </ul>
      )}
    </section>
  );
}
