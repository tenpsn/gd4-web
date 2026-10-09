"use client";

import { useRef } from "react";
import { mapEmbedSrc } from "@/lib/mapEmbed";
import type { Category, Img, LText, Locale } from "@/types/site";
import { AIcon, type AIconName } from "../AIcon";
import { useAdmin } from "../context";
import { ICON_CHOICES, safeUrl, type Field } from "../sectionSchema";
import { btn, FieldError, uploadFile, useToast } from "../ui";

export type Obj = Record<string, unknown>;

/** อ่านค่าของช่องตามภาษาที่กำลังแก้ไข */
export const getVal = (o: Obj, f: Field, lang: Locale): string => {
  const v = o[f.key];
  if (f.i18n) return ((v as LText | undefined)?.[lang] ?? "") as string;
  return v == null ? "" : String(v);
};

/** คืนสำเนาข้อมูลที่ตั้งค่าช่องนี้แล้ว ช่องสองภาษาจะคงค่าของอีกภาษาไว้ */
export const setVal = (o: Obj, f: Field, lang: Locale, v: string): Obj => {
  if (f.i18n) return { ...o, [f.key]: { ...((o[f.key] as LText) ?? { th: "", en: "" }), [lang]: v } };
  if (f.kind === "number") return { ...o, [f.key]: v === "" ? "" : Number(v) };
  return { ...o, [f.key]: v };
};

const control =
  "w-full rounded-lg border border-line bg-field px-3 py-2.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] focus:border-blue-solid focus:shadow-[0_0_0_3px_var(--soft)] aria-[invalid=true]:border-red";

export function FieldInput({ f, o, lang, onChange, err, categories, onPickMedia, disabled }: {
  f: Field;
  o: Obj;
  lang: Locale;
  onChange: (next: Obj) => void;
  err?: string;
  categories: Category[];
  onPickMedia: (current: Img, apply: (src: string) => void) => void;
  disabled?: boolean;
}) {
  const { t, lang: uiLang } = useAdmin();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const v = getVal(o, f, lang);
  const set = (x: string) => onChange(setVal(o, f, lang, x));
  const label = f.label[uiLang];
  // ช่องลิงก์ที่พิมพ์ผิดรูปแบบจะถูกตัดทิ้งตอนบันทึก จึงเตือนไว้ก่อน ปุ่มที่ใช้ลิงก์นี้จะได้ไม่หายไปเงียบ ๆ
  const urlErr = f.url && v.trim() && !safeUrl(v) ? (uiLang === "th" ? "ลิงก์ไม่ถูกต้อง ขึ้นต้นด้วย / สำหรับหน้าในเว็บ เช่น /contact หรือใส่ลิงก์เว็บอื่นเต็ม ๆ เช่น https://example.com" : "Invalid link. Start with / for a page on this site, such as /contact, or enter a full link such as https://example.com") : undefined;
  const mapErr = f.key === "mapEmbed" && v.trim() && !mapEmbedSrc(v) ? (uiLang === "th" ? "ไม่ใช่โค้ดฝังแผนที่ของ Google Maps ระบบจะไม่แสดงแผนที่นี้" : "This is not a Google Maps embed code, so the map will not be shown") : undefined;
  err = err ?? urlErr ?? mapErr;

  let input: React.ReactNode;
  if (f.kind === "area") {
    input = <textarea rows={f.key === "body" || f.key === "a" ? 4 : 2} value={v} onChange={(e) => set(e.target.value)} placeholder={f.ph} aria-label={label} aria-invalid={!!err} lang={f.i18n ? lang : undefined} className={`${control} resize-y text-[14.5px] leading-[1.65] ${f.key === "mapEmbed" ? "font-mono text-[13px]" : ""}`} />;
  } else if (f.kind === "image") {
    const src = o[f.key] as Img;
    const real = src && src !== "placeholder";
    input = (
      <div className={`flex flex-wrap items-center gap-3 rounded-[10px] border bg-field p-2 ${err ? "border-red" : "border-line"}`}>
        <span
          className="grid h-[62px] w-[92px] flex-none place-items-center rounded-md border border-line bg-cover bg-center text-ph-ink"
          style={{ backgroundImage: real ? `url(${src})` : "repeating-linear-gradient(135deg,var(--ph1) 0 6px,var(--ph2) 6px 12px)" }}
        >
          {!real && <AIcon name="image" />}
        </span>
        <span className="min-w-0 flex-[1_1_110px] text-[13.5px] leading-[1.4] text-ink2">
          {real ? src!.split("/").pop() : src === "placeholder" ? (uiLang === "th" ? "ภาพตัวอย่าง (ลายทาง)" : "Sample placeholder") : t.content.noImg}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => onPickMedia(src, (s) => onChange({ ...o, [f.key]: s }))} className={`${btn.outline} min-h-10 px-3 text-[13.5px]`}>
            <AIcon name="image" />
            {t.content.chooseMedia}
          </button>
          <button type="button" onClick={() => file.current?.click()} aria-label={t.content.upload} title={t.content.upload} className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink2 hover:border-blue-solid hover:text-blue">
            <AIcon name="upload" />
          </button>
          {src && (
            <button type="button" onClick={() => onChange({ ...o, [f.key]: null })} aria-label={t.c.del} className="grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink3 hover:bg-red-soft hover:text-red">
              <AIcon name="x" />
            </button>
          )}
        </div>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={async (e) => {
            const fl = e.target.files?.[0];
            e.target.value = "";
            if (!fl) return;
            const r = await uploadFile(fl, "image");
            if ("src" in r) {
              onChange({ ...o, [f.key]: r.src });
              toast("ok", t.toast.imgAdded);
            } else toast("err", t.toast.imgOnly);
          }}
        />
      </div>
    );
  } else if (f.kind === "chips") {
    const opts =
      f.opts === "icons"
        ? ICON_CHOICES.map((i) => ({ v: i, label: { th: i, en: i }, icon: i as AIconName }))
        : f.opts === "cats"
          ? [{ v: "all", label: { th: "ทุกหมวด", en: "All" } }, ...categories.map((c) => ({ v: c.id, label: c.name }))]
          : (f.opts ?? []);
    const cur = String(o[f.key] ?? "");
    input = (
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {opts.map((op) => {
          const on = cur === op.v;
          const icon = "icon" in op ? (op.icon as AIconName) : null;
          return (
            <button
              key={op.v}
              type="button"
              role="radio"
              aria-checked={on}
              title={op.label[uiLang]}
              aria-label={op.label[uiLang]}
              onClick={() => onChange({ ...o, [f.key]: f.key === "count" || f.key === "autoplay" ? Number(op.v) : f.key === "cols" ? (op.v ? Number(op.v) : undefined) : op.v })}
              className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] px-3 text-sm font-medium transition-colors ${
                icon ? "min-w-11" : ""
              } ${on ? "border-blue-solid bg-soft text-blue" : "border-line bg-surface text-ink2"}`}
            >
              {icon ? <AIcon name={icon} size={18} /> : op.label[uiLang]}
            </button>
          );
        })}
      </div>
    );
  } else {
    input = (
      <input
        type={f.kind === "number" ? "number" : "text"}
        step={f.kind === "number" ? "any" : undefined}
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={f.ph}
        aria-label={label}
        aria-invalid={!!err}
        lang={f.i18n ? lang : undefined}
        className={`${control} min-h-11 ${f.kind === "mono" || f.kind === "number" ? "font-mono text-[14px]" : ""}`}
      />
    );
  }

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${f.wide || f.kind === "image" || f.kind === "chips" ? "col-span-full" : ""}`}>
      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink2">
        {label}
        {f.req && <span className="text-red">*</span>}
        {f.i18n && (
          <span className="inline-flex overflow-hidden rounded border border-line font-mono text-[10.5px] font-semibold" role="group" aria-label={uiLang === "th" ? "ภาษาที่กำลังแก้ไข" : "Editing language"}>
            {(["th", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                title={uiLang === "th" ? `แก้ไขภาษา${l === "th" ? "ไทย" : "อังกฤษ"}` : `Edit ${l === "th" ? "Thai" : "English"}`}
                onClick={() => window.dispatchEvent(new CustomEvent("gd4-edit-lang", { detail: l }))}
                className={`cursor-pointer border-0 px-[5px] py-px ${lang === l ? "bg-blue-solid text-white" : "bg-surface text-ink3 hover:text-blue"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </span>
        )}
      </span>
      <fieldset disabled={disabled} className="m-0 min-w-0 border-0 p-0">
        {input}
      </fieldset>
      <FieldError text={err} />
      {f.hint && <span className="text-[13px] leading-normal text-ink3">{f.hint[uiLang]}</span>}
    </div>
  );
}
