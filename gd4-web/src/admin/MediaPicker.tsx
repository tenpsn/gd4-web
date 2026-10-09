"use client";

import { useEffect, useRef, useState } from "react";
import { deleteFile, deleteMedia, listFiles, listMedia, type FileItem } from "@/app/admin/actions/media";
import type { Img } from "@/types/site";
import { AIcon } from "./AIcon";
import { useAdmin } from "./context";
import { Confirm, fmtSize, Modal, uploadFile, useToast } from "./ui";

type Item = { src: string; name: string; size: number; when: string; used: boolean };
type Tab = "img" | "file";

/**
 * หน้าต่างคลังสื่อ มีแท็บรูปภาพ (รวมไอคอนเว็บ) กับแท็บไฟล์ PDF
 * kind บอกว่าช่องที่เปิดคลังต้องการอะไร คลิกเลือกได้เฉพาะชนิดนั้น ไฟล์ ICO เลือกได้เฉพาะช่องไอคอนเว็บ
 * keep คือไฟล์ที่ฟอร์มที่เปิดอยู่ใช้แต่อาจยังไม่ได้บันทึก จะไม่มีปุ่มลบ
 */
export function MediaPicker({ open, current, keep, onPick, onClose, kind = "image" }: {
  open: boolean;
  current: Img;
  keep?: string[];
  onPick: (src: string, name: string, size: number) => void;
  onClose: () => void;
  kind?: "image" | "icon" | "pdf";
}) {
  const { t } = useAdmin();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>(kind === "pdf" ? "file" : "img");
  const [items, setItems] = useState<Item[] | null>(null);
  const [files, setFiles] = useState<FileItem[] | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const [del, setDel] = useState<{ src: string; name: string; file: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    listMedia().then((x) => live && setItems(x));
    listFiles().then((x) => live && setFiles(x));
    return () => {
      live = false;
    };
  }, [open]);

  const canPickImg = (src: string) => kind === "icon" || (kind === "image" && !src.endsWith(".ico"));
  const pick = (src: string, name: string, size: number) => (onPick(src, name, size), onClose());
  // ไฟล์ที่ช่องนี้หรือฟอร์มนี้ใช้อยู่ลบไม่ได้
  const locked = (src: string) => src === current || !!keep?.includes(src);

  const uploadImages = async (list: FileList) => {
    for (const f of Array.from(list)) {
      // ไฟล์ ICO บางเครื่องไม่บอกประเภทไฟล์ จึงดูจากนามสกุลด้วย
      const ico = kind === "icon" && /\.ico$/i.test(f.name);
      if ((!/^image\/(jpeg|png|webp)$/.test(f.type) && !ico) || f.size > 5 * 1024 * 1024) {
        toast("err", t.toast.imgOnly);
        continue;
      }
      const r = await uploadFile(f, kind === "icon" ? "icon" : "image");
      if ("src" in r) {
        setItems((x) => {
          // รูปที่มีอยู่แล้วคงชื่อและสถานะใช้อยู่เดิมไว้ ให้ตรงกับที่เซิร์ฟเวอร์เก็บ
          const old = x?.find((i) => i.src === r.src);
          return [{ ...r, name: old?.name ?? r.name, when: "", used: !!old?.used }, ...(x ?? []).filter((i) => i.src !== r.src)];
        });
        toast("ok", t.toast.imgAdded);
      } else toast("err", t.toast.imgOnly);
    }
  };

  const uploadPdf = async (f?: File) => {
    if (!f) return;
    if (f.type !== "application/pdf" || f.size > 20 * 1024 * 1024) return toast("err", t.toast.pdfOnly);
    const r = await uploadFile(f, "pdf");
    if (!("src" in r)) return toast("err", t.toast.pdfOnly);
    setFiles((x) => [{ ...r, type: "application/pdf", when: "", used: false }, ...(x ?? []).filter((i) => i.src !== r.src)]);
    toast("ok", t.toast.pdfAdded);
  };

  const remove = async () => {
    if (!del) return;
    const target = del;
    setDel(null);
    const r = await (target.file ? deleteFile(target.src) : deleteMedia(target.src));
    if (r.ok) {
      if (target.file) setFiles((x) => (x ?? []).filter((i) => i.src !== target.src));
      else setItems((x) => (x ?? []).filter((i) => i.src !== target.src));
      toast("ok", target.file ? t.media.fileDeleted : t.media.deleted);
    } else toast("err", r.error === "inUse" ? (target.file ? t.media.fileInUse : t.media.inUse) : t.toast.fix);
  };

  const tabBtn = (id: Tab, label: string, n: number | undefined) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`-mb-px inline-flex min-h-11 cursor-pointer items-center gap-1.5 border-0 border-b-2 bg-transparent px-3.5 text-[14.5px] font-semibold ${tab === id ? "border-blue-solid text-blue" : "border-transparent text-ink2 hover:text-ink"}`}
    >
      {label}
      {n !== undefined && <span className="rounded-full bg-surface2 px-2 text-[12px] font-semibold text-ink3">{n}</span>}
    </button>
  );
  const sub = tab === "img" ? t.content.mediaSub : kind === "pdf" ? t.media.pdfSub : t.media.fileSub;

  return (
    <Modal open={open} onClose={onClose} width={860} title={t.media.title} sub={sub}>
      <div role="tablist" className="flex gap-1 border-b border-line px-6">
        {tabBtn("img", t.media.tabImg, items?.length)}
        {tabBtn("file", t.media.tabFile, files?.length)}
      </div>

      {tab === "img" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-6 pb-6 pt-[18px]">
          <button
            type="button"
            onClick={() => imgInput.current?.click()}
            className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-line bg-surface2 text-sm font-semibold text-blue hover:border-blue-solid hover:bg-soft"
          >
            <AIcon name="upload" />
            {t.content.mediaUpload}
          </button>
          <input ref={imgInput} type="file" accept={kind === "icon" ? "image/jpeg,image/png,image/webp,image/x-icon,.ico" : "image/jpeg,image/png,image/webp"} multiple hidden onChange={(e) => (e.target.files && uploadImages(e.target.files), (e.target.value = ""))} />
          {items === null && Array.from({ length: 5 }, (_, i) => <span key={i} className="shimmer aspect-[4/3] rounded-[10px]" />)}
          {items?.map((m) => (
            <div key={m.src} className="group relative">
              <button
                type="button"
                disabled={!canPickImg(m.src)}
                onClick={() => pick(m.src, m.name, m.size)}
                className="flex w-full cursor-pointer flex-col gap-1.5 border-0 bg-transparent p-0 text-left text-ink disabled:cursor-default"
              >
                <span
                  className={`relative aspect-[4/3] w-full rounded-[10px] border-2 bg-cover bg-center transition-[transform,box-shadow] duration-[250ms] ${canPickImg(m.src) ? "hover:-translate-y-0.5 hover:shadow-lift" : kind !== "pdf" ? "opacity-50" : ""} ${
                    m.src === current ? "border-red-solid" : "border-line"
                  }`}
                  style={{ backgroundImage: `url(${m.src})` }}
                >
                  {m.src === current ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-[#c8312a] px-2 py-0.5 text-[11.5px] font-semibold text-white">{t.content.inUse}</span>
                  ) : (
                    m.used && <span className="absolute left-1.5 top-1.5 rounded-full bg-green-soft px-2 py-0.5 text-[11.5px] font-semibold text-green">{t.media.used}</span>
                  )}
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[1.35] text-ink2">{m.name}</span>
              </button>
              {!m.used && !locked(m.src) && (
                <button
                  type="button"
                  onClick={() => setDel({ src: m.src, name: m.name, file: false })}
                  aria-label={`${t.c.del} ${m.name}`}
                  className="absolute right-1.5 top-1.5 grid size-8 cursor-pointer place-items-center rounded-lg border-0 bg-surface/90 text-ink2 opacity-0 shadow-sm transition-opacity hover:text-red focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <AIcon name="trash" size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "file" && (
        <div className="flex flex-col gap-2 px-6 pb-6 pt-[18px]">
          <button
            type="button"
            onClick={() => pdfInput.current?.click()}
            className="flex min-h-14 cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-2 border-dashed border-line bg-surface2 text-sm font-semibold text-blue hover:border-blue-solid hover:bg-soft"
          >
            <AIcon name="upload" />
            {t.media.upload}
          </button>
          <input ref={pdfInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => (uploadPdf(e.target.files?.[0]), (e.target.value = ""))} />
          {files === null && Array.from({ length: 3 }, (_, i) => <span key={i} className="shimmer h-[62px] rounded-[10px]" />)}
          {files?.length === 0 && <span className="py-6 text-center text-sm text-ink3">{t.media.noFiles}</span>}
          {files?.map((f) => {
            const pickable = kind === "pdf";
            const inUse = f.used || f.src === current;
            const body = (
              <>
                <span className="grid size-10 flex-none place-items-center rounded-lg bg-red-soft text-red">
                  <AIcon name="file" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-semibold text-ink">{f.name}</span>
                  <span className="text-[13px] text-ink2">
                    PDF · {fmtSize(f.size)}
                  </span>
                </span>
                {inUse && <span className="flex-none rounded-full bg-green-soft px-2.5 py-[3px] text-[12.5px] font-semibold text-green">{t.media.used}</span>}
              </>
            );
            return (
              <div key={f.src} className={`flex items-center gap-2 rounded-[10px] border p-2.5 ${f.src === current ? "border-red-solid" : "border-line"}`}>
                {pickable ? (
                  <button type="button" onClick={() => pick(f.src, f.name, f.size)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent p-0 text-left hover:opacity-80">
                    {body}
                  </button>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
                )}
                <a href={f.src} target="_blank" rel="noopener noreferrer" aria-label={f.name} className="grid size-9 flex-none place-items-center rounded-lg text-ink3 hover:bg-surface2 hover:text-blue">
                  <AIcon name="external" size={16} />
                </a>
                {!inUse && !locked(f.src) && (
                  <button type="button" onClick={() => setDel({ src: f.src, name: f.name, file: true })} aria-label={`${t.c.del} ${f.name}`} className="grid size-9 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink3 hover:bg-red-soft hover:text-red">
                    <AIcon name="trash" size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        onOk={remove}
        title={del?.file ? t.media.delFileTitle : t.media.delTitle}
        text={del?.file ? t.media.delFileText : t.media.delText}
        items={del ? [del.name] : undefined}
        okLabel={t.c.del}
      />
    </Modal>
  );
}
