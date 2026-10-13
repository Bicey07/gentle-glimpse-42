import { useI18n } from "@/lib/i18n";
import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { actions } from "../../lib/store";
import { errorText, roomSchema } from "../../lib/rooms/model";
import { JourneyButton, JourneyLabel, fieldClass } from "./JourneyUi";

const colors = ["#B8C9B0", "#C9D3DE", "#D7C9B8", "#CFC2D6", "#D6C2C2"];
export function CreateRoom() {
  const { t: tx } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const navigate = useNavigate();
  if (!open)
    return (
      <JourneyButton onClick={() => setOpen(true)}>
        <Plus size={14} />
        {tx("创建一个小世界")}
      </JourneyButton>
    );
  return (
    <form
      className="mb-7 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        try {
          const room = roomSchema.parse({
            id: `room-${crypto.randomUUID()}`,
            name,
            description,
            color,
          });
          const result = await actions.createRoom({ ...room, presence: "房间成员" });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          void navigate({ to: "/rooms/$id", params: { id: room.id } });
        } catch (error) {
          setError(errorText(error));
        } finally {
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <JourneyLabel>A little world</JourneyLabel>
        <button type="button" disabled={busy} aria-label={tx("取消创建")} onClick={() => setOpen(false)}>
          <X size={16} />
        </button>
      </div>
      <h2 className="my-4 font-serif text-lg">{tx("想和谁，一起做点什么？")}</h2>
      <label className="block text-xs">
        {tx("小世界的名字")}
        <input
          autoFocus
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
          placeholder={tx("周六，一起去看展")}
        />
      </label>
      <label className="mt-4 block text-xs">
        {tx("一张公开的邀请纸条")}
        <textarea
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={160}
          rows={2}
          placeholder={tx("下午两点，在美术馆门口见。")}
        />
      </label>
      <fieldset className="mt-4">
        <legend className="mb-3 text-xs">{tx("给它一个颜色")}</legend>
        <div className="flex gap-3">
          {colors.map((value, index) => (
            <button
              key={value}
              type="button"
              aria-label={tx("房间颜色 {number}", { number: index + 1 })}
              aria-pressed={color === value}
              onClick={() => setColor(value)}
              className={`h-7 w-7 rounded-full border-2 ${color === value ? "border-[var(--ink)]" : "border-transparent"}`}
              style={{ background: value }}
            />
          ))}
        </div>
      </fieldset>
      <p className="my-4 text-[11px] leading-relaxed text-[var(--quiet)]">
        {tx("名称和邀请纸条会随链接分享，请只填写愿意公开的信息。房间会保存到云端。")}
      </p>
      {error && (
        <p role="alert" className="mb-3 text-xs text-red-800">
          {tx(error)}
        </p>
      )}
      <JourneyButton type="submit" disabled={busy}>{busy ? tx("正在创建…") : tx("创建房间")}</JourneyButton>
    </form>
  );
}
