"use client";

import { useRef, useState } from "react";
import type { GlobalContent } from "@/server/types";
import type { Category, Img, Locale, Section, SectionBg } from "@/types/site";
import { AIcon, type AIconName } from "../AIcon";
import { useAdmin } from "../context";
import { CONTACT_FIELDS, newItem, TYPES } from "../sectionSchema";
import { FieldInput, getVal, type Obj } from "./fields";

export type Errors = Record<string, string>;
/** สร้างรหัสระบุข้อผิดพลาด จากส่วน รายการ ช่อง และภาษา */
export const errKey = (sec: string, item: string, field: string, lang: string) => `${sec}|${item}|${field}|${lang}`;

const BG_OPTS: { v: SectionBg; th: string; en: string; sw: string }[] = [
  { v: "white", th: "ขาว", en: "White", sw: "var(--surface)" },
  { v: "gray", th: "เทาอ่อน", en: "Light gray", sw: "var(--bg)" },
  { v: "blue", th: "ฟ้าอ่อน", en: "Soft blue", sw: "var(--soft)" },
  { v: "navy", th: "น้ำเงินเข้ม", en: "Navy", sw: "var(--panel)" },
];

const iconBtn = "grid size-9 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 transition-colors hover:bg-soft hover:text-blue";

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

export function SectionCard({ s, n, open, onToggle, onChange, onDup, onDelete, onMove, drag, lang, errors, categories, onPickMedia, contact, onContact, canEdit, canDel }: {
  s: Section;
  n: number;
  open: boolean;
  onToggle: () => void;
  onChange: (s: Section) => void;
  onDup: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  drag: { onStart: () => void; onEnter: () => void; onEnd: () => void; dragging: boolean };
  lang: Locale;
  errors: Errors;
  categories: Category[];
  onPickMedia: (current: Img, apply: (src: string) => void) => void;
  contact: GlobalContent["contact"];
  onContact: (c: GlobalContent["contact"]) => void;
  canEdit: boolean;
  canDel: boolean;
}) {
  const { lang: ui, t } = useAdmin();
  const def = TYPES[s.type];
  const o = s as unknown as Obj;
  const items = ("items" in s ? s.items : []) as Obj[];
  const title = (o.heading as { th: string } | undefined)?.[lang as "th"] || (def.item && items[0] ? getVal(items[0], def.item.fields.find((f) => f.key === def.item!.summary)!, lang) : "") || def.name[ui];
  const hasErr = Object.keys(errors).some((k) => k.startsWith(`${s.id}|`));
  const meta = `${def.name[ui]}${def.item ? ` · ${items.length} ${t.c.items}` : ""}`;

  return (
    <div
      onDragEnter={drag.onEnter}
      onDragOver={(e) => e.preventDefault()}
      id={`sec-${s.id}`}
      className={`rounded-xl border-[1.5px] bg-surface transition-[border-color,opacity] duration-200 ${open ? "border-blue-solid" : hasErr ? "border-red" : "border-line"} ${drag.dragging ? "opacity-40" : ""} ${s.hidden ? "bg-surface2" : ""}`}
    >
      <div className="flex min-h-16 flex-wrap items-center gap-0.5 py-1.5 pl-1 pr-2">
        {canEdit && (
          <span draggable onDragStart={drag.onStart} onDragEnd={drag.onEnd} title={t.content.drag} className="hidden h-12 w-7 flex-none cursor-grab place-items-center text-ink3 md2:grid">
            <AIcon name="drag" />
          </span>
        )}
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-[52px] min-w-0 flex-[1_1_180px] cursor-pointer items-center gap-3 border-0 bg-transparent p-1.5 text-left text-ink">
          <span className={`grid size-[38px] flex-none place-items-center rounded-[10px] ${hasErr ? "bg-red-soft text-red" : "bg-soft text-blue"}`}>
            <AIcon name={def.icon as AIconName} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex-none font-mono text-xs font-semibold text-ink3">{String(n).padStart(2, "0")}</span>
              <strong className={`overflow-hidden text-ellipsis whitespace-nowrap text-[15.5px] font-semibold ${s.hidden ? "text-ink3" : ""}`}>{title || t.content.untitled}</strong>
              {s.hidden && <span className="flex-none rounded-full bg-amber-soft px-2 py-0.5 text-[11.5px] font-semibold text-amber">{t.content.hiddenBadge}</span>}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink2">{meta}</span>
          </span>
        </button>
        <div className="ml-auto flex items-center">
          {canEdit && (
            <>
              <button type="button" onClick={() => onMove(-1)} aria-label={t.c.up} title={t.c.up} className={`${iconBtn} md2:hidden`}>
                <AIcon name="chevU" />
              </button>
              <button type="button" onClick={() => onMove(1)} aria-label={t.c.down} title={t.c.down} className={`${iconBtn} md2:hidden`}>
                <AIcon name="chevD" />
              </button>
              <button type="button" onClick={() => onChange({ ...s, hidden: !s.hidden })} aria-label={s.hidden ? t.content.show : t.content.hide} title={s.hidden ? t.content.show : t.content.hide} className={iconBtn}>
                <AIcon name={s.hidden ? "eyeOff" : "eye"} />
              </button>
              <button type="button" onClick={onDup} aria-label={t.content.dup} title={t.content.dup} className={iconBtn}>
                <AIcon name="copy" />
              </button>
            </>
          )}
          {canDel && (
            <button type="button" onClick={onDelete} aria-label={t.c.del} title={t.c.del} className={`${iconBtn} hover:bg-red-soft hover:text-red`}>
              <AIcon name="trash" />
            </button>
          )}
          <button type="button" onClick={onToggle} aria-label={t.c.edit} className="grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2">
            <span className={`grid transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
              <AIcon name="chevD" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-[18px] border-t border-line px-[18px] pb-[18px] pt-4 [animation:a-up_.3s_ease-out_both]">
          {s.type === "products" && (
            <span className="flex items-center gap-2 rounded-lg bg-soft px-3 py-2.5 text-[13.5px] text-blue">
              <AIcon name="box" />
              {t.content.fromCatalog}
            </span>
          )}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5">
            {def.fields
              .filter((f) => !(s.type === "products" && f.key === "count" && (s as { catalog?: boolean }).catalog))
              .map((f) => (
                <FieldInput
                  key={f.key}
                  f={f}
                  o={o}
                  lang={lang}
                  disabled={!canEdit}
                  categories={categories}
                  onPickMedia={onPickMedia}
                  err={errors[errKey(s.id, "", f.key, f.i18n ? lang : "")]}
                  onChange={(next) => onChange(next as unknown as Section)}
                />
              ))}
            {s.type === "contact" &&
              CONTACT_FIELDS.map((f) => (
                <FieldInput
                  key={f.key}
                  f={f}
                  o={contact as unknown as Obj}
                  lang={lang}
                  disabled={!canEdit}
                  categories={categories}
                  onPickMedia={onPickMedia}
                  err={errors[errKey("contact", "", f.key, f.i18n ? lang : "")]}
                  onChange={(next) => onContact(next as unknown as GlobalContent["contact"])}
                />
              ))}
          </div>

          {!def.noBg && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-ink2">{t.content.bg}</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.content.bg}>
                {BG_OPTS.map((b) => (
                  <button
                    key={b.v}
                    type="button"
                    role="radio"
                    aria-checked={s.bg === b.v}
                    disabled={!canEdit}
                    onClick={() => onChange({ ...s, bg: b.v })}
                    className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] bg-surface py-0 pl-1.5 pr-3 text-[13.5px] text-ink transition-colors ${s.bg === b.v ? "border-blue-solid" : "border-line"}`}
                  >
                    <span className="grid size-[26px] place-items-center rounded-full border border-line text-blue" style={{ background: b.sw }}>
                      {s.bg === b.v && <AIcon name="check" size={14} />}
                    </span>
                    {b[ui]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {def.item && <ItemList s={s} items={items} lang={lang} errors={errors} categories={categories} onPickMedia={onPickMedia} canEdit={canEdit} onChange={(list) => onChange({ ...s, items: list } as Section)} />}
        </div>
      )}
    </div>
  );
}

function ItemList({ s, items, lang, errors, categories, onPickMedia, canEdit, onChange }: {
  s: Section;
  items: Obj[];
  lang: Locale;
  errors: Errors;
  categories: Category[];
  onPickMedia: (current: Img, apply: (src: string) => void) => void;
  canEdit: boolean;
  onChange: (items: Obj[]) => void;
}) {
  const { lang: ui, t } = useAdmin();
  const def = TYPES[s.type].item!;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const from = useRef<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const sumField = def.fields.find((f) => f.key === def.summary)!;

  const move = (a: number, b: number) => {
    if (b < 0 || b >= items.length) return;
    const n = [...items];
    const [x] = n.splice(a, 1);
    n.splice(b, 0, x);
    onChange(n);
  };
  const add = () => {
    const it = newItem(s.type, uid("i"));
    onChange([...items, it]);
    setOpen((o) => ({ ...o, [String(it.id)]: true }));
  };
  const minOne = s.type === "hero";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[13px] font-semibold text-ink2">{def.name[ui]}</span>
        <span className="text-[12.5px] text-ink3">
          {items.length} {t.c.items}
        </span>
      </div>
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-[10px] border-[1.5px] border-dashed border-line px-4 py-[22px] text-center [animation:a-up_.3s_both]">
          <span className="text-sm text-ink2">{t.c.emptyItems}</span>
          {canEdit && (
            <button type="button" onClick={add} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-0 bg-blue-solid px-[18px] text-[14.5px] font-semibold text-white hover:bg-blue-h">
              <AIcon name="plus" />
              {t.c.addFirst}
            </button>
          )}
        </div>
      )}
      {items.map((it, i) => {
        const iid = String(it.id);
        const isOpen = !!open[iid];
        const err = Object.keys(errors).some((k) => k.startsWith(`${s.id}|${iid}|`));
        const img = def.fields.find((f) => f.kind === "image");
        const thumb = img ? (it[img.key] as Img) : null;
        return (
          <div
            key={iid}
            onDragEnter={() => {
              if (from.current !== null && from.current !== i) {
                move(from.current, i);
                from.current = i;
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            className={`rounded-[10px] border-[1.5px] bg-surface2 transition-[border-color,opacity] [animation:a-up_.3s_cubic-bezier(.2,.7,.2,1)_both] ${
              err ? "border-red" : isOpen ? "border-blue-solid" : "border-line"
            } ${dragging === iid ? "opacity-40" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-0.5 py-1 pl-0.5 pr-1.5">
              {canEdit && (
                <span
                  draggable
                  onDragStart={() => {
                    from.current = i;
                    setDragging(iid);
                  }}
                  onDragEnd={() => {
                    from.current = null;
                    setDragging(null);
                  }}
                  title={t.content.drag}
                  className="hidden h-11 w-[26px] flex-none cursor-grab place-items-center text-ink3 md2:grid"
                >
                  <AIcon name="drag" />
                </span>
              )}
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [iid]: !isOpen }))} aria-expanded={isOpen} className="flex min-h-11 min-w-0 flex-[1_1_150px] cursor-pointer items-center gap-2.5 border-0 bg-transparent p-1 text-left text-ink">
                <span className="flex-none font-mono text-[12.5px] font-semibold text-red">{String(i + 1).padStart(2, "0")}</span>
                {img && (
                  <span
                    className="h-7 w-10 flex-none rounded border border-line bg-cover bg-center"
                    style={{ backgroundImage: thumb && thumb !== "placeholder" ? `url(${thumb})` : "repeating-linear-gradient(135deg,var(--ph1) 0 4px,var(--ph2) 4px 8px)" }}
                  />
                )}
                {"icon" in it && (
                  <span className="grid flex-none text-blue">
                    <AIcon name={it.icon as AIconName} />
                  </span>
                )}
                <span className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-medium ${it.hidden ? "text-ink3" : ""}`}>{getVal(it, sumField, lang) || t.content.untitled}</span>
                {!!it.hidden && <span className="flex-none rounded-full bg-amber-soft px-2 py-0.5 text-[11.5px] font-semibold text-amber">{t.content.hiddenBadge}</span>}
              </button>
              <div className="ml-auto flex items-center">
                {canEdit && (
                  <>
                    <button type="button" onClick={() => move(i, i - 1)} aria-label={t.c.up} className={`${iconBtn} md2:hidden`}>
                      <AIcon name="chevU" />
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} aria-label={t.c.down} className={`${iconBtn} md2:hidden`}>
                      <AIcon name="chevD" />
                    </button>
                    <button type="button" onClick={() => onChange(items.map((x, j) => (j === i ? { ...x, hidden: !x.hidden } : x)))} aria-label={it.hidden ? t.content.show : t.content.hide} title={it.hidden ? t.content.show : t.content.hide} className={iconBtn}>
                      <AIcon name={it.hidden ? "eyeOff" : "eye"} />
                    </button>
                    <button type="button" onClick={() => onChange([...items.slice(0, i + 1), { ...structuredClone(it), id: uid("i") }, ...items.slice(i + 1)])} aria-label={t.content.dup} title={t.content.dup} className={iconBtn}>
                      <AIcon name="copy" />
                    </button>
                    <button
                      type="button"
                      onClick={() => (minOne && items.length <= 1 ? null : onChange(items.filter((_, j) => j !== i)))}
                      disabled={minOne && items.length <= 1}
                      aria-label={t.c.del}
                      title={minOne && items.length <= 1 ? t.toast.minSlide : t.c.del}
                      className={`${iconBtn} hover:bg-red-soft hover:text-red disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <AIcon name="trash" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [iid]: !isOpen }))} aria-label={t.c.edit} className={iconBtn}>
                  <span className={`grid transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    <AIcon name="chevD" />
                  </span>
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3 border-t border-line px-3.5 pb-3.5 pt-2 [animation:a-up_.3s_ease-out_both]">
                {def.fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    f={f}
                    o={it}
                    lang={lang}
                    disabled={!canEdit}
                    categories={categories}
                    onPickMedia={onPickMedia}
                    err={errors[errKey(s.id, iid, f.key, f.i18n ? lang : "")]}
                    onChange={(next) => onChange(items.map((x, j) => (j === i ? next : x)))}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {canEdit && items.length > 0 && (
        <button type="button" onClick={add} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-line bg-transparent text-[14.5px] font-semibold text-blue transition-colors hover:border-blue-solid hover:bg-soft">
          <AIcon name="plus" />
          {t.content.addItem}
        </button>
      )}
    </div>
  );
}
