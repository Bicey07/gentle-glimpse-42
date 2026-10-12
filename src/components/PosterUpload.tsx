import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";

export function PosterUpload({ file, onChange, disabled = false }: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const { t: tx } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function select(files: File[]) {
    if (disabled || !files.length) return;
    if (files.length !== 1) { setError(tx("请一次选择一张电影海报。")); return; }
    if (!files[0].type.startsWith("image/")) { setError(tx("请选择图片文件作为电影海报。")); return; }
    setError("");
    onChange(files[0]);
  }

  return <div>
    <div
      className="rounded-2xl border-2 border-dashed p-5 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[var(--bluegrey)]"
      style={{ borderColor: dragging ? "var(--bluegrey)" : "var(--border)", background: dragging ? "#e0ebf7" : "var(--card)", opacity: disabled ? .6 : 1 }}
      onDragEnter={e => { e.preventDefault(); if (!disabled) { dragDepth.current++; setDragging(true); } }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? "none" : "copy"; }}
      onDragLeave={e => { e.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
      onDrop={e => { e.preventDefault(); dragDepth.current = 0; setDragging(false); select(Array.from(e.dataTransfer.files)); }}
    >
      {preview && <img src={preview} alt={tx("电影海报预览")} className="mx-auto mb-4 max-h-56 max-w-full rounded-lg object-contain" />}
      <p className="text-sm text-[var(--ink)]">{dragging ? tx("松开即可放入海报") : tx("把电影海报拖到这里（可选）")}</p>
      {file && <p className="mt-2 break-all text-xs text-[var(--quiet)]">{file.name}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="rounded-full border border-[var(--border)] bg-[#e7eff9] px-4 py-2 text-sm">{file ? tx("选择其他本地图片") : tx("选择本地文件")}</button>
        {file && <button type="button" disabled={disabled} onClick={() => { onChange(null); setError(""); }} className="px-3 py-2 text-sm text-[var(--quiet)]">{tx("移除海报")}</button>}
      </div>
      <input ref={input} type="file" accept="image/*" disabled={disabled} aria-label={tx("选择电影海报")} className="sr-only" tabIndex={-1} onChange={e => { select(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-[var(--destructive)]">{error}</p>}
  </div>;
}
