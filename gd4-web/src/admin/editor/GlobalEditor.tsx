"use client";

import { useState } from "react";
import { SocialGlyph, SOCIALS } from "@/components/SocialIcon";
import type { GlobalContent } from "@/server/types";
import type { Img, LText, Locale, MenuItem, SocialPlatform } from "@/types/site";
import { AIcon, type AIconName } from "../AIcon";
import { useAdmin } from "../context";
import { btn } from "../ui";

/** ลำดับแพลตฟอร์มที่ให้เลือก */
const PLAT_ORDER: SocialPlatform[] = ["facebook", "line", "youtube", "instagram", "tiktok", "x", "linkedin", "custom"];

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;
const inp = "w-full min-h-11 rounded-lg border border-line bg-field px-3 py-2.5 text-[15px] text-ink outline-none focus:border-blue-solid focus:shadow-[0_0_0_3px_var(--soft)]";
const iconBtn = "grid size-9 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 hover:bg-soft hover:text-blue";

function Card({ icon, title, sub, children }: { icon: AIconName; title: string; sub: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-xl border-[1.5px] bg-surface ${open ? "border-blue-solid" : "border-line"}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-16 w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-ink">
        <span className="grid size-[38px] flex-none place-items-center rounded-[10px] bg-soft text-blue">
          <AIcon name={icon} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="text-[15.5px] font-semibold">{title}</strong>
          <span className="text-[13px] text-ink2">{sub}</span>
        </span>
        <span className={`grid transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <AIcon name="chevD" />
        </span>
      </button>
      {open && <div className="flex flex-col gap-3 border-t border-line px-[18px] pb-[18px] pt-4 [animation:a-up_.3s_both]">{children}</div>}
    </div>
  );
}

export function GlobalEditor({ g, lang, onChange, canEdit, onPickMedia }: {
  g: GlobalContent;
  lang: Locale;
  onChange: (g: GlobalContent) => void;
  canEdit: boolean;
  onPickMedia: (current: Img, apply: (src: string) => void) => void;
}) {
  const { lang: ui, t } = useAdmin();
  const setLabel = (l: LText, v: string): LText => ({ ...l, [lang]: v });
  const setMenu = (menu: MenuItem[]) => onChange({ ...g, menu });
  const moveIn = <T,>(list: T[], a: number, b: number) => {
    if (b < 0 || b >= list.length) return list;
    const n = [...list];
    const [x] = n.splice(a, 1);
    n.splice(b, 0, x);
    return n;
  };
  const customLabel = ui === "th" ? "ช่องทางอื่น ใส่โลโก้เอง" : "Other, with your own logo";
  const tag = <span className="rounded bg-soft px-[5px] py-px font-mono text-[10.5px] font-semibold text-blue">{lang.toUpperCase()}</span>;

  return (
    <fieldset disabled={!canEdit} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <Card icon="menu" title={ui === "th" ? "เมนูหลัก" : "Main menu"} sub={ui === "th" ? "ลิงก์ในแถบเมนูด้านบน · เมนูย่อยแสดงเป็น dropdown" : "Top navigation links · sub-items show as a dropdown"}>
        {g.menu.map((m, i) => (
          <div key={m.id} className="flex flex-col gap-2 rounded-[10px] border border-line bg-surface2 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-6 font-mono text-[12.5px] font-semibold text-red">{String(i + 1).padStart(2, "0")}</span>
              <label className="flex min-w-0 flex-[1_1_160px] flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink2">
                  {ui === "th" ? "ชื่อเมนู" : "Menu label"} {tag}
                </span>
                <input value={m.label[lang]} onChange={(e) => setMenu(g.menu.map((x, j) => (j === i ? { ...x, label: setLabel(x.label, e.target.value) } : x)))} className={inp} lang={lang} />
              </label>
              <label className="flex min-w-0 flex-[1_1_140px] flex-col gap-1">
                <span className="text-xs font-semibold text-ink2">{ui === "th" ? "ลิงก์" : "Link"}</span>
                <input value={m.url} onChange={(e) => setMenu(g.menu.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="/about" className={`${inp} font-mono text-sm`} />
              </label>
              <div className="flex self-end">
                <button type="button" onClick={() => setMenu(moveIn(g.menu, i, i - 1))} aria-label={t.c.up} className={iconBtn}>
                  <AIcon name="chevU" />
                </button>
                <button type="button" onClick={() => setMenu(moveIn(g.menu, i, i + 1))} aria-label={t.c.down} className={iconBtn}>
                  <AIcon name="chevD" />
                </button>
                <button type="button" onClick={() => setMenu(g.menu.filter((_, j) => j !== i))} aria-label={t.c.del} className={`${iconBtn} hover:bg-red-soft hover:text-red`}>
                  <AIcon name="trash" />
                </button>
              </div>
            </div>
            {(m.children ?? []).map((k, ki) => (
              <div key={k.id} className="ml-8 flex flex-wrap items-center gap-2">
                <span className="text-ink3">↳</span>
                <input
                  value={k.label[lang]}
                  onChange={(e) => setMenu(g.menu.map((x, j) => (j === i ? { ...x, children: x.children!.map((y, yi) => (yi === ki ? { ...y, label: setLabel(y.label, e.target.value) } : y)) } : x)))}
                  aria-label={ui === "th" ? "ชื่อเมนูย่อย" : "Sub-item label"}
                  className={`${inp} min-h-10 flex-[1_1_140px] w-auto text-sm`}
                  lang={lang}
                />
                <input
                  value={k.url}
                  onChange={(e) => setMenu(g.menu.map((x, j) => (j === i ? { ...x, children: x.children!.map((y, yi) => (yi === ki ? { ...y, url: e.target.value } : y)) } : x)))}
                  aria-label={ui === "th" ? "ลิงก์เมนูย่อย" : "Sub-item link"}
                  className={`${inp} min-h-10 flex-[1_1_120px] w-auto font-mono text-[13px]`}
                />
                <button type="button" onClick={() => setMenu(g.menu.map((x, j) => (j === i ? { ...x, children: x.children!.filter((_, yi) => yi !== ki) } : x)))} aria-label={t.c.del} className={`${iconBtn} hover:bg-red-soft hover:text-red`}>
                  <AIcon name="x" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMenu(g.menu.map((x, j) => (j === i ? { ...x, children: [...(x.children ?? []), { id: uid("mk"), label: { th: "", en: "" }, url: "/" }] } : x)))}
              className="ml-8 inline-flex w-fit cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-blue"
            >
              <AIcon name="plus" size={14} />
              {ui === "th" ? "เพิ่มเมนูย่อย" : "Add sub-item"}
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setMenu([...g.menu, { id: uid("m"), label: { th: "", en: "" }, url: "/" }])} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-line bg-transparent text-[14.5px] font-semibold text-blue hover:border-blue-solid hover:bg-soft">
          <AIcon name="plus" />
          {t.content.addItem}
        </button>
      </Card>

      <Card icon="copy" title={t.content.social} sub={ui === "th" ? "แสดงในส่วนท้ายเว็บ" : "Shown in the footer"}>
        {g.socials.map((so, i) => (
          <div key={so.id} className="flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-surface2 p-2.5">
            <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={ui === "th" ? "แพลตฟอร์ม" : "Platform"}>
              {PLAT_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={so.platform === p}
                  title={p === "custom" ? customLabel : SOCIALS[p].name}
                  aria-label={p === "custom" ? customLabel : SOCIALS[p].name}
                  onClick={() => onChange({ ...g, socials: g.socials.map((x, j) => (j === i ? { ...x, platform: p } : x)) })}
                  className={`grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border-2 text-[11px] font-bold text-white ${so.platform === p ? "border-blue-solid" : "border-transparent opacity-50"}`}
                  style={{ background: p === "custom" && so.icon ? "#fff" : SOCIALS[p].bg }}
                >
                  <SocialGlyph social={p === "custom" ? { platform: p, icon: so.icon } : { platform: p }} size={16} />
                </button>
              ))}
            </div>
            <input value={so.url} onChange={(e) => onChange({ ...g, socials: g.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://" aria-label="URL" className={`${inp} min-h-10 flex-[1_1_200px] w-auto font-mono text-[13px]`} />
            {so.platform === "custom" && (
              <div className="flex w-full flex-wrap items-center gap-2">
                <input
                  value={so.name ?? ""}
                  onChange={(e) => onChange({ ...g, socials: g.socials.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  placeholder={ui === "th" ? "ชื่อช่องทาง เช่น Shopee" : "Channel name, e.g. Shopee"}
                  aria-label={ui === "th" ? "ชื่อช่องทาง" : "Channel name"}
                  className={`${inp} min-h-10 flex-[1_1_160px] w-auto text-[14px]`}
                />
                <button
                  type="button"
                  onClick={() => onPickMedia(so.icon ?? null, (src) => onChange({ ...g, socials: g.socials.map((x, j) => (j === i ? { ...x, icon: src } : x)) }))}
                  className={`${btn.outline} min-h-10 text-sm`}
                >
                  <AIcon name="image" />
                  {so.icon ? (ui === "th" ? "เปลี่ยนโลโก้" : "Change logo") : ui === "th" ? "เลือกโลโก้" : "Choose logo"}
                </button>
                {so.icon && (
                  <button type="button" onClick={() => onChange({ ...g, socials: g.socials.map((x, j) => (j === i ? { ...x, icon: null } : x)) })} className="min-h-10 cursor-pointer border-0 bg-transparent px-2 text-sm text-red">
                    {ui === "th" ? "ลบโลโก้" : "Remove logo"}
                  </button>
                )}
              </div>
            )}
            <button type="button" onClick={() => onChange({ ...g, socials: g.socials.filter((_, j) => j !== i) })} aria-label={t.c.del} className={`${iconBtn} hover:bg-red-soft hover:text-red`}>
              <AIcon name="trash" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...g, socials: [...g.socials, { id: uid("so"), platform: "facebook", url: "https://" }] })} className={`${btn.outline} min-h-10 w-fit text-sm`}>
          <AIcon name="plus" />
          {t.content.addItem}
        </button>
      </Card>

      <Card icon="text" title={ui === "th" ? "ส่วนท้ายเว็บ" : "Footer"} sub={ui === "th" ? "ข้อความท้ายทุกหน้า" : "Text at the bottom of every page"}>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-ink2">
            {ui === "th" ? "คำอธิบายบริษัท" : "Company blurb"} {tag}
          </span>
          <textarea rows={3} value={g.footer.body[lang]} onChange={(e) => onChange({ ...g, footer: { ...g.footer, body: setLabel(g.footer.body, e.target.value) } })} className={`${inp} resize-y text-[14.5px] leading-[1.65]`} lang={lang} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-ink2">
            {ui === "th" ? "ข้อความลิขสิทธิ์" : "Copyright line"} {tag}
          </span>
          <input value={g.footer.copyright[lang]} onChange={(e) => onChange({ ...g, footer: { ...g.footer, copyright: setLabel(g.footer.copyright, e.target.value) } })} className={inp} lang={lang} />
        </label>
      </Card>
    </fieldset>
  );
}
