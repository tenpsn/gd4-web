"use client";

import { useEffect, useRef, useState } from "react";
import { listMedia } from "@/app/admin/actions/media";
import type { Img } from "@/types/site";
import { AIcon } from "./AIcon";
import { useAdmin } from "./context";
import { Modal, uploadFile, useToast } from "./ui";

type Item = { src: string; name: string; size: number; when: string };

/** หน้าต่างคลังสื่อ เลือกรูปที่อัปโหลดไว้แล้ว หรืออัปโหลดรูปใหม่ */
export function MediaPicker({ open, current, onPick, onClose }: { open: boolean; current: Img; onPick: (src: string) => void; onClose: () => void }) {
  const { t } = useAdmin();
  const toast = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    listMedia().then((x) => live && setItems(x));
    return () => {
      live = false;
    };
  }, [open]);

  const upload = async (files: FileList) => {
    for (const f of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024) {
        toast("err", t.toast.imgOnly);
        continue;
      }
      const r = await uploadFile(f, "image");
      if ("src" in r) {
        setItems((x) => [{ ...r, when: "" }, ...(x ?? [])]);
        toast("ok", t.toast.imgAdded);
      } else toast("err", t.toast.imgOnly);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={860} title={t.content.mediaTitle} sub={t.content.mediaSub}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-6 pb-6 pt-[18px]">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-line bg-surface2 text-sm font-semibold text-blue hover:border-blue-solid hover:bg-soft"
        >
          <AIcon name="upload" />
          {t.content.mediaUpload}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => (e.target.files && upload(e.target.files), (e.target.value = ""))} />
        {items === null &&
          Array.from({ length: 5 }, (_, i) => <span key={i} className="shimmer aspect-[4/3] rounded-[10px]" />)}
        {items?.map((m) => (
          <button
            key={m.src}
            type="button"
            onClick={() => (onPick(m.src), onClose())}
            className="flex cursor-pointer flex-col gap-1.5 border-0 bg-transparent p-0 text-left text-ink"
          >
            <span
              className={`relative aspect-[4/3] w-full rounded-[10px] border-2 bg-cover bg-center transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-0.5 hover:shadow-lift ${
                m.src === current ? "border-red-solid" : "border-line"
              }`}
              style={{ backgroundImage: `url(${m.src})` }}
            >
              {m.src === current && <span className="absolute left-1.5 top-1.5 rounded-full bg-[#c8312a] px-2 py-0.5 text-[11.5px] font-semibold text-white">{t.content.inUse}</span>}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[1.35] text-ink2">{m.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
