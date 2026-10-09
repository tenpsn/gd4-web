"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { MediaPicker } from "@/admin/MediaPicker";
import { useAdmin } from "@/admin/context";
import { fmtDate } from "@/admin/i18n";
import { IMG_MAX, SHORT_MAX, validateProduct, type ProductErrors, type ProductInput } from "@/admin/productRules";
import { btn, Confirm, FieldError, fmtSize, label, mediaSrcs, Modal, Pill, PubBar, RadioCard, Req, uploadFile, useToast, useUnsavedGuard } from "@/admin/ui";
import type { Category, LText, Locale, ProductImage } from "@/types/site";
import { deleteProducts, saveProduct } from "../../actions/products";
import { CategoriesModal } from "./CategoriesModal";

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

export function ProductForm({ initial, categories, others, meta, canEdit, canPublish, canDel }: {
  initial: ProductInput;
  categories: Category[];
  /** รหัสสินค้าของสินค้าอื่น ใช้ตรวจว่ารหัสซ้ำหรือไม่ */
  others: { id: string; sku: string }[];
  meta: { updatedAt?: string; byName?: LText } | null;
  canEdit: boolean;
  canPublish: boolean;
  canDel: boolean;
}) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<ProductInput>(initial);
  const [saved, setSaved] = useState<ProductInput>(initial);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [tab, setTab] = useState<Locale>("th");
  const [pending, start] = useTransition();
  const [dz, setDz] = useState(false);
  const [picker, setPicker] = useState(false);
  const [pdfPicker, setPdfPicker] = useState(false);
  const [preview, setPreview] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [del, setDel] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const isNew = !initial.id;
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);
  useUnsavedGuard(dirty && canEdit);

  /** อัปเดตฟอร์ม และถ้ามีข้อผิดพลาดแสดงอยู่ จะตรวจซ้ำเฉพาะช่องที่ผิดเท่านั้น */
  const set = (fn: (x: ProductInput) => ProductInput) =>
    setF((x) => {
      const next = fn(x);
      if (Object.keys(errors).length) {
        const v = validateProduct(next, others);
        setErrors(Object.fromEntries(Object.keys(errors).filter((k) => v[k as keyof ProductErrors]).map((k) => [k, v[k as keyof ProductErrors]])));
      }
      return next;
    });
  const setL = (k: "name" | "short" | "detail", v: string) => set((x) => ({ ...x, [k]: { ...x[k], [tab]: v } }));

  const save = (status: "pub" | "draft") => {
    const next = { ...f, status };
    const e = validateProduct(next, others);
    if (Object.keys(e).length) {
      setErrors(e);
      // สลับไปที่แท็บภาษาที่มีข้อผิดพลาด
      const th = e.name_th || e.short_th, en = e.name_en || e.short_en;
      if (th && !(en && tab === "en") && tab !== "th") setTab("th");
      else if (en && !th) setTab("en");
      toast("err", t.toast.fix);
      return;
    }
    start(async () => {
      try {
        const res = await saveProduct(next, status);
        if (!res.ok) {
          setErrors(res.errors);
          toast("err", t.toast.fix);
          return;
        }
        const stored = { ...next, id: res.id };
        setF(stored);
        setSaved(stored);
        setErrors({});
        toast("ok", status === "pub" ? t.toast.pub : t.toast.draft);
        if (isNew) router.replace(`/admin/products/${res.id}`);
        else router.refresh();
      } catch {
        toast("err", t.toast.fix);
      }
    });
  };

  /* รูปภาพ */
  const imgMax = t.form.imgMax.replace("{max}", String(IMG_MAX));
  /** ต่อท้ายรูปใหม่ ข้ามรูปที่มีในสินค้านี้แล้วและรูปที่เกินจำนวนสูงสุด */
  const appendImages = (add: ProductImage[]) => {
    const have = new Set(f.images.map((i) => i.src));
    const fresh = add.filter((im) => !have.has(im.src) && have.add(im.src));
    const keep = fresh.slice(0, Math.max(0, IMG_MAX - f.images.length));
    if (fresh.length < add.length) toast("err", t.form.imgDup);
    if (keep.length < fresh.length) toast("err", imgMax);
    if (!keep.length) return;
    set((x) => ({ ...x, images: [...x.images, ...keep].slice(0, IMG_MAX), mainId: x.mainId ?? keep[0].id }));
    toast("ok", t.toast.imgAdded);
  };
  const addImages = async (files: FileList | File[]) => {
    if (f.images.length >= IMG_MAX) return toast("err", imgMax);
    const all = Array.from(files);
    const list = all.filter((x) => /^image\/(jpeg|png|webp)$/.test(x.type) && x.size <= 5 * 1024 * 1024);
    if (!list.length || list.length !== all.length) toast("err", t.toast.imgOnly);
    if (!list.length) return;
    // อัปโหลดเฉพาะเท่าที่ยังใส่ได้ ไฟล์ที่เกินจะไม่ถูกส่งขึ้นคลัง
    const room = IMG_MAX - f.images.length;
    if (list.length > room) toast("err", imgMax);
    const done: ProductImage[] = [];
    for (const file of list.slice(0, room)) {
      const r = await uploadFile(file, "image");
      if ("src" in r) done.push({ id: uid("im"), src: r.src, label: { th: r.name, en: r.name } });
      else toast("err", t.toast.imgOnly);
    }
    if (done.length) appendImages(done);
  };
  /** เพิ่มรูปที่เลือกจากคลังสื่อ */
  const pickImage = (src: string, name: string) => appendImages([{ id: uid("im"), src, label: { th: name, en: name } }]);
  const moveImg = (from: number, to: number) =>
    set((x) => {
      if (to < 0 || to >= x.images.length) return x;
      const images = [...x.images];
      const [m] = images.splice(from, 1);
      images.splice(to, 0, m);
      return { ...x, images };
    });
  const removeImg = (id: string) =>
    set((x) => {
      const images = x.images.filter((i) => i.id !== id);
      return { ...x, images, mainId: x.mainId === id ? images[0]?.id ?? null : x.mainId };
    });

  /* ไฟล์ PDF */
  const addPdf = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024) {
      toast("err", t.toast.pdfOnly);
      return;
    }
    const r = await uploadFile(file, "pdf");
    if (!("src" in r)) {
      toast("err", t.toast.pdfOnly);
      return;
    }
    set((x) => ({ ...x, pdf: r }));
    toast("ok", t.toast.pdfAdded);
  };

  /* ช่องพิมพ์ข้อความแบบจัดรูปแบบได้ เซิร์ฟเวอร์จะล้างโค้ดอันตรายออกตอนบันทึก */
  const rte = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rte.current && rte.current.innerHTML !== f.detail[tab]) rte.current.innerHTML = f.detail[tab];
    // ทำเฉพาะตอนสลับแท็บหรือโหลดข้อมูล ส่วนตอนพิมพ์ค่าจะอัปเดตจากช่องพิมพ์เอง
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, saved]);
  const cmd = (name: string, value?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (name === "createLink") {
      const url = window.prompt("URL", "https://");
      if (!url) return;
      value = url;
    }
    document.execCommand(name, false, value);
    if (rte.current) setL("detail", rte.current.innerHTML);
  };

  const err = (k: keyof ProductErrors) => (errors[k] ? t.form[errors[k]!] : undefined);
  const tabErr = (l: Locale) => !!(errors[`name_${l}`] || errors[`short_${l}`]);
  const shortLen = f.short[tab].length;
  const pubState = isNew && !dirty ? "new" : dirty ? "unsaved" : "saved";
  const main = f.images.find((i) => i.id === f.mainId) ?? f.images[0];
  const catName = categories.find((c) => c.id === f.category)?.name[lang] ?? "";

  const section = "card flex flex-col gap-4 p-[22px] pb-[22px]";
  const h2 = "m-0 text-[17px] font-semibold";

  return (
    <div className="flex flex-col gap-5">
      <PubBar
        state={pubState}
        ctx={f.name[lang] || t.form.addTitle}
        busy={pending}
        canDraft={canEdit}
        canPublish={canPublish}
        onDraft={() => save("draft")}
        onPublish={() => save("pub")}
        extra={
          <button type="button" onClick={() => setPreview(true)} aria-label={t.form.preview} title={t.form.preview} className="grid size-10 flex-none cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink2 hover:border-blue-solid hover:text-blue">
            <AIcon name="eye" />
          </button>
        }
      />

      <div className="anim-up flex flex-col gap-2.5">
        <Link href="/admin/products" className={`${btn.link} min-h-9 w-fit`}>
          <AIcon name="arrowL" />
          {t.form.back}
        </Link>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-[clamp(22px,3vw,28px)] font-bold">{isNew ? t.form.addTitle : t.form.editTitle}</h1>
            {f.status === "pub" ? <Pill tone="green">{t.prod.pub}</Pill> : <Pill tone="amber">{t.prod.draft}</Pill>}
            {dirty && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber [animation:a-fade_.3s_both]">
                <span className="size-[7px] rounded-full bg-current" />
                {t.c.unsaved}
              </span>
            )}
          </div>
          <span className="text-[14.5px] text-ink2">{isNew ? t.form.newNote : f.name[lang]}</span>
        </div>
      </div>

      <fieldset disabled={!canEdit} className="m-0 grid min-w-0 grid-cols-1 items-start gap-5 border-0 p-0 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* ข้อมูลสินค้าแยกตามภาษา */}
          <section className="card anim-up [animation-delay:.05s]">
            <div className="px-[22px] pt-5">
              <h2 className={h2}>{t.form.info}</h2>
            </div>
            <div role="tablist" className="flex gap-1 border-b border-line px-3.5 pt-1.5">
              {(["th", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={tab === l}
                  onClick={() => setTab(l)}
                  className={`relative flex min-h-[46px] cursor-pointer items-center gap-2 border-0 bg-transparent px-3.5 text-[14.5px] font-semibold transition-colors ${tab === l ? "text-ink" : "text-ink3"}`}
                >
                  {l === "th" ? t.c.th : t.c.en}
                  {tabErr(l) && <span className="size-[7px] rounded-full bg-red" />}
                  <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-sm bg-brand-red transition-transform duration-300 ${tab === l ? "scale-x-100" : "scale-x-0"}`} />
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-[18px] px-[22px] pb-[22px] pt-5">
              <label className="flex flex-col gap-2">
                <span className={label}>
                  {t.form.name}
                  <Req />
                </span>
                <input value={f.name[tab]} onChange={(e) => setL("name", e.target.value)} aria-invalid={!!err(`name_${tab}`)} className="field min-h-11" lang={tab} />
                <FieldError text={err(`name_${tab}`)} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="flex justify-between gap-2.5">
                  <span className={label}>{t.form.short}</span>
                  <span className={`font-mono text-[12.5px] font-medium ${shortLen > SHORT_MAX ? "text-red" : "text-ink3"}`}>
                    {shortLen}/{SHORT_MAX}
                  </span>
                </span>
                <textarea rows={2} value={f.short[tab]} onChange={(e) => setL("short", e.target.value)} aria-invalid={!!err(`short_${tab}`)} className="field resize-y leading-[1.6]" lang={tab} />
                <FieldError text={err(`short_${tab}`)} />
              </label>
              <div className="flex flex-col gap-2">
                <span className={label}>{t.form.detail}</span>
                <div className="overflow-hidden rounded-lg border border-line bg-field">
                  <div className="flex gap-0.5 border-b border-line bg-surface2 p-1">
                    {(
                      [
                        ["bold", "B", "Bold"],
                        ["italic", "I", "Italic"],
                        ["|"],
                        ["insertUnorderedList", "list", "Bulleted list"],
                        ["insertOrderedList", "1.", "Numbered list"],
                        ["createLink", "link", "Link"],
                      ] as const
                    ).map((b, i) =>
                      b[0] === "|" ? (
                        <span key={i} className="mx-1 my-2 w-px bg-line" />
                      ) : (
                        <button
                          key={b[0]}
                          type="button"
                          onMouseDown={cmd(b[0])}
                          aria-label={b[2]}
                          title={b[2]}
                          className={`grid size-[38px] cursor-pointer place-items-center rounded-md border-0 bg-transparent text-ink2 hover:bg-soft hover:text-blue ${b[0] === "italic" ? "font-serif italic" : "font-bold"}`}
                        >
                          {b[1] === "list" ? <AIcon name="list" /> : b[1] === "link" ? <AIcon name="external" /> : b[1]}
                        </button>
                      ),
                    )}
                  </div>
                  <div
                    ref={rte}
                    contentEditable={canEdit}
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label={t.form.detail}
                    lang={tab}
                    data-ph={t.form.detailPh}
                    onInput={(e) => setL("detail", (e.target as HTMLDivElement).innerHTML)}
                    className="rte min-h-[180px] p-3.5 text-[15px] leading-[1.75] text-ink outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* รูปภาพ */}
          <section className={`${section} anim-up [animation-delay:.1s]`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={h2}>{t.form.images}</h2>
              <span className="text-[13.5px] text-ink3">
                {f.images.length}/{IMG_MAX} {lang === "th" ? "รูป" : "images"}
              </span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => imgInput.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && imgInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDz(true);
              }}
              onDragLeave={() => setDz(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDz(false);
                if (e.dataTransfer.files.length) addImages(e.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-2 border-dashed px-4 py-[26px] text-center transition-colors hover:border-blue-solid ${dz ? "border-blue-solid bg-soft" : "border-line bg-surface2"}`}
            >
              <span className={`grid size-12 place-items-center rounded-full bg-soft text-blue transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${dz ? "scale-110" : ""}`}>
                <AIcon name="upload" />
              </span>
              <strong className="text-[15px] font-semibold">{t.form.imgDrop}</strong>
              <span className="text-[13.5px] text-ink2">{t.form.imgHint}</span>
            </div>
            <input ref={imgInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => (e.target.files && addImages(e.target.files), (e.target.value = ""))} />
            <button type="button" onClick={() => setPicker(true)} className={`${btn.outline} min-h-10 self-start px-3.5 text-sm`}>
              <AIcon name="image" />
              {t.content.chooseMedia}
            </button>
            {f.images.length > 0 && (
              <>
                <span className="text-[13.5px] text-ink2">{t.form.imgOrder}</span>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
                  {f.images.map((im, i) => {
                    const isMain = im.id === (f.mainId ?? f.images[0]?.id);
                    const real = im.src && im.src !== "placeholder";
                    return (
                      <div
                        key={im.id}
                        draggable={canEdit}
                        onDragStart={() => {
                          dragFrom.current = i;
                          setDragging(im.id);
                        }}
                        onDragEnter={() => {
                          if (dragFrom.current !== null && dragFrom.current !== i) {
                            moveImg(dragFrom.current, i);
                            dragFrom.current = i;
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={() => {
                          dragFrom.current = null;
                          setDragging(null);
                        }}
                        className={`relative aspect-square cursor-grab overflow-hidden rounded-[10px] border-2 bg-cover bg-center transition-[opacity,border-color,box-shadow] [animation:a-pop_.35s_cubic-bezier(.34,1.56,.64,1)_both] hover:shadow-lift ${
                          isMain ? "border-red-solid" : "border-line"
                        } ${dragging === im.id ? "opacity-40" : ""}`}
                        style={{ backgroundImage: real ? `url(${im.src})` : "repeating-linear-gradient(135deg,var(--ph1) 0 6px,var(--ph2) 6px 12px)" }}
                      >
                        {!real && <span className="absolute inset-0 grid place-items-center px-2.5 py-7 text-center font-mono text-[11.5px] font-medium text-ph-ink">{im.label[lang]}</span>}
                        {isMain && (
                          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[#c8312a] px-2 py-[3px] text-[11.5px] font-semibold text-white">
                            <AIcon name="star" size={12} />
                            {t.form.main}
                          </span>
                        )}
                        <span className="absolute bottom-2 left-2 rounded bg-[rgba(15,27,45,.65)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">{i + 1}</span>
                        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1">
                          <button type="button" onClick={() => removeImg(im.id)} aria-label={t.c.del} className={imgBtn + " hover:bg-[#c8312a]"}>
                            <AIcon name="x" size={16} />
                          </button>
                          {!isMain && (
                            <button type="button" onClick={() => set((x) => ({ ...x, mainId: im.id }))} aria-label={t.form.setMain} title={t.form.setMain} className={imgBtn + " hover:bg-[#1a4fa0]"}>
                              <AIcon name="star" size={16} />
                            </button>
                          )}
                        </div>
                        {/* บนมือถือลากไม่ได้ จึงมีปุ่มลูกศรให้เลื่อนแทน */}
                        <div className="absolute bottom-1.5 right-1.5 flex gap-1 md2:hidden">
                          <button type="button" onClick={() => moveImg(i, i - 1)} aria-label={t.c.up} className={imgBtn}>
                            <AIcon name="chevL" size={16} />
                          </button>
                          <button type="button" onClick={() => moveImg(i, i + 1)} aria-label={t.c.down} className={imgBtn}>
                            <AIcon name="chevR" size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* ข้อมูลจำเพาะ */}
          <section className={`${section} gap-3 anim-up [animation-delay:.15s]`}>
            <h2 className={h2}>{t.form.specs}</h2>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-2 text-[13px] font-semibold text-ink2">
              <span>
                {t.form.specKey} ({tab.toUpperCase()})
              </span>
              <span>{t.form.specVal}</span>
              <span />
            </div>
            {f.specs.map((sp, i) => (
              <div key={sp.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-2 [animation:a-up_.3s_ease-out_both]">
                <input
                  value={sp.k[tab]}
                  onChange={(e) => set((x) => ({ ...x, specs: x.specs.map((s, j) => (j === i ? { ...s, k: { ...s.k, [tab]: e.target.value } } : s)) }))}
                  placeholder={tab === "en" ? sp.k.th : sp.k.en}
                  aria-label={`${t.form.specKey} ${i + 1}`}
                  className="field min-h-11 text-[14.5px]"
                />
                <input
                  value={sp.v}
                  onChange={(e) => set((x) => ({ ...x, specs: x.specs.map((s, j) => (j === i ? { ...s, v: e.target.value } : s)) }))}
                  aria-label={`${t.form.specVal} ${i + 1}`}
                  className="field min-h-11 text-[14.5px]"
                />
                <button type="button" onClick={() => set((x) => ({ ...x, specs: x.specs.filter((_, j) => j !== i) }))} aria-label={t.c.del} className="grid size-11 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink3 hover:bg-red-soft hover:text-red">
                  <AIcon name="trash" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set((x) => ({ ...x, specs: [...x.specs, { id: uid("sp"), k: { th: "", en: "" }, v: "" }] }))}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-line bg-transparent text-[14.5px] font-semibold text-blue transition-colors hover:border-blue-solid hover:bg-soft"
            >
              <AIcon name="plus" />
              {t.form.addRow}
            </button>
          </section>

          {/* แคตตาล็อก PDF */}
          <section className={`${section} gap-3.5 anim-up [animation-delay:.2s]`}>
            <h2 className={h2}>{t.form.catalog}</h2>
            {f.pdf ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-surface2 p-3 [animation:a-up_.3s_both]">
                <span className="grid size-11 flex-none place-items-center rounded-lg bg-red-soft text-red">
                  <AIcon name="file" />
                </span>
                <span className="flex min-w-[140px] flex-1 flex-col gap-0.5">
                  <a href={f.pdf.src} target="_blank" rel="noopener noreferrer" className="break-all text-[14.5px] font-bold text-ink hover:text-blue">
                    {f.pdf.name}
                  </a>
                  <span className="text-[13px] text-ink2">PDF · {fmtSize(f.pdf.size)}</span>
                </span>
                <button type="button" onClick={() => setPdfPicker(true)} className={`${btn.outline} min-h-10 px-3.5 text-sm`}>
                  <AIcon name="file" />
                  {t.content.chooseMedia}
                </button>
                <button type="button" onClick={() => pdfInput.current?.click()} className={`${btn.outline} min-h-10 px-3.5 text-sm`}>
                  {t.form.replace}
                </button>
                <button type="button" onClick={() => set((x) => ({ ...x, pdf: null }))} aria-label={t.c.del} className="grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink3 hover:bg-red-soft hover:text-red">
                  <AIcon name="trash" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => pdfInput.current?.click()} className="flex min-h-16 cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-2 border-dashed border-line bg-surface2 text-[14.5px] text-ink2 hover:border-blue-solid hover:text-blue">
                <AIcon name="upload" />
                {t.form.pdfHint}
              </button>
            )}
            {!f.pdf && (
              <button type="button" onClick={() => setPdfPicker(true)} className={`${btn.outline} min-h-10 self-start px-3.5 text-sm`}>
                <AIcon name="file" />
                {t.content.chooseMedia}
              </button>
            )}
            <input ref={pdfInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => (addPdf(e.target.files?.[0]), (e.target.value = ""))} />
          </section>
        </div>

        <div className="flex flex-col gap-5 min-[1100px]:sticky min-[1100px]:top-0">
          <section className="card anim-up flex flex-col gap-3 p-5 [animation-delay:.1s]" role="radiogroup" aria-label={t.form.publishing}>
            <h2 className="m-0 text-base font-semibold">{t.form.publishing}</h2>
            <RadioCard on={f.status === "pub"} onPick={() => set((x) => ({ ...x, status: "pub" }))} title={t.prod.pub} desc={t.form.pubDesc} disabled={!canPublish} />
            <RadioCard on={f.status === "draft"} onPick={() => set((x) => ({ ...x, status: "draft" }))} title={t.prod.draft} desc={t.form.draftDesc} />
            {meta?.updatedAt && (
              <span className="text-[13px] leading-normal text-ink3">
                {t.form.lastSaved} {fmtDate(meta.updatedAt, lang)} · {meta.byName?.[lang] ?? "—"}
              </span>
            )}
            {!isNew && canDel && (
              <button type="button" onClick={() => setDel(true)} className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-1.5 text-sm font-medium text-red hover:bg-red-soft">
                <AIcon name="trash" />
                {t.c.del}
              </button>
            )}
          </section>
          <section className="card anim-up flex flex-col gap-4 p-5 [animation-delay:.15s]">
            <h2 className="m-0 text-base font-semibold">{t.form.org}</h2>
            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between gap-2.5">
                <span className={label}>
                  {t.form.category}
                  <Req />
                </span>
                <button type="button" onClick={() => setCatsOpen(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[13.5px] font-medium text-blue">
                  {t.form.manageCats}
                </button>
              </span>
              <select value={f.category} onChange={(e) => set((x) => ({ ...x, category: e.target.value }))} aria-invalid={!!err("cat")} className="field min-h-11 cursor-pointer py-0">
                <option value="">{t.form.choose}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[lang]}
                  </option>
                ))}
              </select>
              <FieldError text={err("cat")} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={label}>
                {t.form.sku}
                <Req />
              </span>
              <input value={f.sku} onChange={(e) => set((x) => ({ ...x, sku: e.target.value }))} placeholder="PM-12" aria-invalid={!!err("sku")} className="field min-h-11 font-mono font-medium" />
              <FieldError text={err("sku")} />
              <span className="text-[13px] text-ink3">{t.form.skuHint}</span>
            </label>
          </section>
        </div>
      </fieldset>

      {/* ตัวอย่างหน้าตาเหมือนที่จะแสดงบนหน้าสินค้าจริง */}
      <Modal open={preview} onClose={() => setPreview(false)} width={980} title={<span className="flex items-center gap-2 text-[15px]"><AIcon name="eye" />{t.form.preview}</span>}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-7 p-6">
          <div className="flex flex-col gap-2.5">
            <div
              className="grid aspect-square place-items-center rounded-xl bg-cover bg-center font-mono text-[13px] font-medium text-ph-ink"
              style={{ backgroundImage: main?.src && main.src !== "placeholder" ? `url(${main.src})` : "repeating-linear-gradient(135deg,var(--ph1) 0 8px,var(--ph2) 8px 16px)" }}
            >
              {!(main?.src && main.src !== "placeholder") && (main?.label[lang] ?? f.sku)}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {f.images.slice(0, 4).map((im) => (
                <span
                  key={im.id}
                  className={`aspect-square rounded-lg border-2 bg-cover bg-center ${im.id === main?.id ? "border-blue-solid" : "border-line"}`}
                  style={{ backgroundImage: im.src && im.src !== "placeholder" ? `url(${im.src})` : "repeating-linear-gradient(135deg,var(--ph1) 0 6px,var(--ph2) 6px 12px)" }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="text-[13.5px] font-semibold text-blue">{catName}</span>
            <h2 className="m-0 text-2xl font-bold leading-[1.35]">{f.name[lang]}</h2>
            <span className="font-mono text-[13px] font-medium text-ink3">SKU {f.sku}</span>
            <p className="m-0 text-[15.5px] leading-[1.7] text-ink2">{f.short[lang]}</p>
            <div className="flex flex-wrap gap-2.5">
              <span className="rounded-lg bg-[#c8312a] px-[18px] py-3 font-semibold text-white">{lang === "th" ? "ขอใบเสนอราคา" : "Request a quote"}</span>
              {f.pdf && (
                <span className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-line px-[18px] py-[11px] font-semibold">
                  <AIcon name="download" />
                  {t.form.catalog}
                </span>
              )}
            </div>
            {/* แสดงข้อความที่ผู้ดูแลพิมพ์ไว้แต่ยังไม่บันทึก เซิร์ฟเวอร์จะล้างโค้ดอันตรายตอนบันทึก */}
            <div className="rte text-[15px] leading-[1.75] text-ink" dangerouslySetInnerHTML={{ __html: f.detail[lang] }} />
            {f.specs.some((s) => s.k[lang]) && (
              <>
                <strong className="mt-1.5 text-base">{t.form.specs}</strong>
                <table className="w-full border-collapse text-[14.5px]">
                  <tbody>
                    {f.specs
                      .filter((s) => s.k[lang])
                      .map((s) => (
                        <tr key={s.id} className="border-t border-line">
                          <td className="w-[45%] py-2.5 text-ink2">{s.k[lang]}</td>
                          <td className="py-2.5 font-medium">{s.v}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </Modal>

      <MediaPicker open={pdfPicker} kind="pdf" current={f.pdf?.src ?? null} onPick={(src, name, size) => (set((x) => ({ ...x, pdf: { src, name, size } })), toast("ok", t.toast.pdfAdded))} onClose={() => setPdfPicker(false)} />
      <MediaPicker open={picker} current={null} keep={mediaSrcs(f.images)} onPick={pickImage} onClose={() => setPicker(false)} />
      {catsOpen && <CategoriesModal categories={categories} counts={{}} onClose={() => setCatsOpen(false)} />}

      <Confirm
        open={del}
        onClose={() => setDel(false)}
        onOk={() =>
          start(async () => {
            await deleteProducts([initial.id!]);
            setSaved(f); // ไม่มีงานค้างแล้ว ออกจากหน้าได้เลย
            toast("ok", t.toast.deleted);
            router.push("/admin/products");
          })
        }
        title={t.cf.delTitle}
        text={t.cf.delText}
        items={[f.name[lang]]}
        okLabel={t.cf.delOk}
      />
    </div>
  );
}

const imgBtn = "grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-[rgba(15,27,45,.7)] text-white";
