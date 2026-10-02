"use client";

import { useRef, useState } from "react";
import { DEFAULT_DESIGN, FONT_CHOICES, SIZE_RANGE } from "@/content/design";
import type { ColorKey, Design, SizeKey } from "@/types/site";
import { AIcon, type AIconName } from "../AIcon";
import { useAdmin } from "../context";
import { btn, FieldError, Modal, uploadFile, useToast } from "../ui";

type Dev = "d" | "t" | "m";
const SIZES: SizeKey[] = ["h1", "h2", "h3", "body", "btn", "menu"];
const COLORS: ColorKey[] = ["primary", "accent", "bg", "bg2", "heading", "text", "muted"];
const RADII = [0, 4, 8, 12, 20];
const SPACING: [number, "sp_c" | "sp_n" | "sp_r", string][] = [
  [0.75, "sp_c", "6px"],
  [1, "sp_n", "10px"],
  [1.3, "sp_r", "15px"],
];

const fontCss = (n: string) => `'${n}','IBM Plex Sans Thai',sans-serif`;
const resetBtn = "min-h-8 cursor-pointer border-0 bg-transparent px-2 text-[13px] text-ink3 hover:text-red";
const card = "card flex flex-col gap-3.5 px-[18px] pb-[18px] pt-4";
const pick = (on: boolean) => (on ? "border-blue-solid bg-soft text-blue" : "border-line bg-surface text-ink2");

/** โหลดฟอนต์จาก Google Fonts เพื่อให้แต่ละการ์ดแสดงหน้าตาฟอนต์ของตัวเอง */
function FontLoader({ names }: { names: string[] }) {
  const fam = names.filter((n) => n !== "IBM Plex Sans Thai");
  if (!fam.length) return null;
  const href = `https://fonts.googleapis.com/css2?${fam.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600`).join("&")}&display=swap`;
  return <link rel="stylesheet" href={href} />;
}

export function DesignPanel({ d, onChange, dev, setDev, scheme, setScheme, canEdit }: {
  d: Design;
  onChange: (d: Design) => void;
  dev: Dev;
  setDev: (v: Dev) => void;
  scheme: "light" | "dark";
  setScheme: (v: "light" | "dark") => void;
  canEdit: boolean;
}) {
  const { t } = useAdmin();
  const [role, setRole] = useState<"heading" | "body">("heading");
  const [fontModal, setFontModal] = useState(false);
  const set = (fn: (x: Design) => void) => {
    const n = structuredClone(d);
    fn(n);
    onChange(n);
  };
  const D = DEFAULT_DESIGN;
  const allFonts = [...FONT_CHOICES, ...d.customFonts.map((f) => f.name)];
  const devs: [Dev, AIconName, string][] = [
    ["d", "monitor", t.set.dev_d],
    ["t", "tablet", t.set.dev_t],
    ["m", "mobile", t.set.dev_m],
  ];

  return (
    <fieldset disabled={!canEdit} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both]">
      <FontLoader names={[...FONT_CHOICES, ...d.customFonts.filter((f) => f.kind === "google").map((f) => f.name)]} />
      {d.customFonts.some((f) => f.kind === "file") && (
        <style>{d.customFonts.filter((f) => f.kind === "file").map((f) => `@font-face{font-family:'${f.name}';src:url(${f.src})}`).join("")}</style>
      )}
      <div className="card flex flex-wrap items-center gap-3 px-4 py-3.5">
        <div className="flex flex-[1_1_220px] flex-col gap-[3px]">
          <strong className="text-base">{t.dz.title}</strong>
          <span className="text-[13.5px] leading-normal text-ink2">{t.dz.sub}</span>
        </div>
        <button type="button" onClick={() => onChange(structuredClone({ ...D, customFonts: d.customFonts }))} className={`${btn.outline} min-h-10 px-3.5 text-sm hover:border-red hover:text-red`}>
          <AIcon name="undo" />
          {t.dz.reset}
        </button>
      </div>

      {/* ฟอนต์ */}
      <section className={card}>
        <div className="flex items-center gap-2.5">
          <strong className="flex-1 text-[15.5px]">{t.dz.fonts}</strong>
          <button type="button" onClick={() => set((x) => void (x.fonts = { ...D.fonts }))} className={resetBtn}>
            {t.dz.resetOne}
          </button>
          <button type="button" onClick={() => setFontModal(true)} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-line bg-transparent px-3 text-[13.5px] font-semibold text-blue hover:border-blue-solid">
            <AIcon name="plus" size={16} />
            {t.dz.addFont}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(["heading", "body"] as const).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border-[1.5px] px-3 py-2.5 text-left transition-colors ${pick(role === r)}`}>
              <span className="text-[12.5px] font-semibold">{r === "heading" ? t.dz.fHeading : t.dz.fBody}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-semibold text-ink">{d.fonts[r]}</span>
            </button>
          ))}
        </div>
        <div className="grid max-h-80 grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 overflow-auto p-0.5">
          {allFonts.map((name) => {
            const on = d.fonts[role] === name;
            const custom = d.customFonts.some((f) => f.name === name);
            return (
              <div
                key={name}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => canEdit && set((x) => void (x.fonts[role] = name))}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && canEdit && set((x) => void (x.fonts[role] = name))}
                className={`relative flex cursor-pointer flex-col gap-1.5 rounded-[10px] border-[1.5px] p-3 transition-[border-color,transform] hover:-translate-y-0.5 ${on ? "border-blue-solid bg-soft" : "border-line bg-surface"}`}
              >
                <span className="text-[22px] leading-[1.2] text-ink" style={{ fontFamily: fontCss(name) }}>
                  Aa กข
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink2" style={{ fontFamily: fontCss(name) }}>
                  {t.dz.sample}
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
                  {on && (
                    <span className="grid text-blue">
                      <AIcon name="check" size={16} />
                    </span>
                  )}
                </span>
                {custom && (
                  <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                    <span className="rounded-full bg-amber-soft px-1.5 py-px text-[10.5px] font-semibold text-amber">{t.dz.custom}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        set((x) => {
                          x.customFonts = x.customFonts.filter((f) => f.name !== name);
                          if (x.fonts.heading === name) x.fonts.heading = D.fonts.heading;
                          if (x.fonts.body === name) x.fonts.body = D.fonts.body;
                        });
                      }}
                      aria-label={t.c.del}
                      className="grid size-[26px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-ink3 hover:bg-red-soft hover:text-red"
                    >
                      <AIcon name="x" size={14} />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ขนาดตัวอักษรของแต่ละอุปกรณ์ */}
      <section className={`${card} gap-3`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex flex-[1_1_180px] flex-col gap-0.5">
            <strong className="text-[15.5px]">{t.dz.sizes}</strong>
            <span className="text-[13px] text-ink2">{t.dz.sizesSub}</span>
          </span>
          <button type="button" onClick={() => set((x) => void (x.sizes = structuredClone(D.sizes)))} className={resetBtn}>
            {t.dz.resetOne}
          </button>
        </div>
        <div className="flex w-fit gap-0.5 rounded-lg border border-line p-[3px]" role="tablist">
          {devs.map(([k, icon, l]) => (
            <button key={k} type="button" role="tab" aria-selected={dev === k} onClick={() => setDev(k)} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border-0 px-3 text-[13.5px] font-semibold transition-colors ${dev === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}>
              <AIcon name={icon} size={16} />
              {l}
            </button>
          ))}
        </div>
        {SIZES.map((k) => {
          const [min, max] = SIZE_RANGE[k];
          const v = d.sizes[k][dev];
          const on = (n: number) => set((x) => void (x.sizes[k][dev] = Math.min(max, Math.max(min, n || min))));
          return (
            <div key={k} className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-x-3 gap-y-1.5 border-t border-line py-1.5">
              <span className="text-sm font-medium">{t.dz[`s_${k}`]}</span>
              <span className="inline-flex items-center rounded-md border border-line bg-field">
                <input type="number" min={min} max={max} step={0.5} value={v} onChange={(e) => on(Number(e.target.value))} aria-label={t.dz[`s_${k}`]} className="min-h-9 w-full min-w-0 border-0 bg-transparent px-2 font-mono text-sm font-medium text-ink outline-none" />
                <span className="pr-2 text-xs text-ink3">px</span>
              </span>
              <input type="range" min={min} max={max} step={0.5} value={v} onChange={(e) => on(Number(e.target.value))} aria-label={t.dz[`s_${k}`]} className="col-span-full h-6 w-full cursor-pointer accent-[var(--blue-solid)]" />
            </div>
          );
        })}
      </section>

      {/* ความหนา ระยะห่างบรรทัด และระยะห่างตัวอักษร */}
      <section className={card}>
        <div className="flex items-center gap-2.5">
          <strong className="flex-1 text-[15.5px]">{t.dz.style}</strong>
          <button type="button" onClick={() => set((x) => Object.assign(x, { weight: { ...D.weight }, lh: { ...D.lh }, ls: { ...D.ls } }))} className={resetBtn}>
            {t.dz.resetOne}
          </button>
        </div>
        {(["heading", "body"] as const).map((r) => (
          <div key={r} className="flex flex-col gap-2.5 rounded-[10px] border border-line bg-surface2 p-3">
            <strong className="text-sm">{r === "heading" ? t.dz.rHeading : t.dz.rBody}</strong>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-ink2">{t.dz.weight}</span>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t.dz.weight}>
                {[300, 400, 500, 600, 700, 800].map((w) => (
                  <button key={w} type="button" role="radio" aria-checked={d.weight[r] === w} onClick={() => set((x) => void (x.weight[r] = w))} className={`min-h-9 min-w-12 cursor-pointer rounded-md border-[1.5px] text-[13.5px] ${pick(d.weight[r] === w)}`} style={{ fontWeight: w }}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-[13px] text-ink2">
                <span>{t.dz.lh}</span>
                <span className="font-mono text-[12.5px] font-medium text-ink">{d.lh[r].toFixed(2)}</span>
              </span>
              <input type="range" min={1} max={2.2} step={0.05} value={d.lh[r]} onChange={(e) => set((x) => void (x.lh[r] = Number(e.target.value)))} className="h-6 w-full cursor-pointer accent-[var(--blue-solid)]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-[13px] text-ink2">
                <span>{t.dz.ls}</span>
                <span className="font-mono text-[12.5px] font-medium text-ink">{(d.ls[r] / 100).toFixed(3)}em</span>
              </span>
              <input type="range" min={-1} max={4} step={0.1} value={d.ls[r]} onChange={(e) => set((x) => void (x.ls[r] = Number(e.target.value)))} className="h-6 w-full cursor-pointer accent-[var(--blue-solid)]" />
            </label>
          </div>
        ))}
      </section>

      {/* สี */}
      <section className={`${card} gap-3`}>
        <div className="flex items-center gap-2.5">
          <strong className="flex-1 text-[15.5px]">{t.dz.colors}</strong>
          <button type="button" onClick={() => set((x) => void (x.colors[scheme] = { ...D.colors[scheme] }))} className={resetBtn}>
            {t.dz.resetOne}
          </button>
        </div>
        <div className="flex w-fit gap-0.5 rounded-lg border border-line p-[3px]" role="tablist">
          {(["light", "dark"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={scheme === m} onClick={() => setScheme(m)} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border-0 px-3 text-[13.5px] font-semibold ${scheme === m ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}>
              <AIcon name={m === "light" ? "sun" : "moon"} size={16} />
              {t.dz[m]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
          {COLORS.map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-line p-2 hover:border-blue-solid">
              <input type="color" value={d.colors[scheme][k]} onChange={(e) => set((x) => void (x.colors[scheme][k] = e.target.value))} aria-label={t.dz[`c_${k}`]} className="size-[38px] flex-none cursor-pointer border-0 bg-transparent p-0" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold">{t.dz[`c_${k}`]}</span>
                <span className="font-mono text-xs font-medium text-ink2">{d.colors[scheme][k]}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* รูปทรง */}
      <section className={card}>
        <div className="flex items-center gap-2.5">
          <strong className="flex-1 text-[15.5px]">{t.dz.shape}</strong>
          <button type="button" onClick={() => set((x) => Object.assign(x, { radius: D.radius, spacing: D.spacing }))} className={resetBtn}>
            {t.dz.resetOne}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink2">{t.dz.radius}</span>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t.dz.radius}>
            {RADII.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={d.radius === r} onClick={() => set((x) => void (x.radius = r))} className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] px-1 py-2.5 text-xs font-semibold ${pick(d.radius === r)}`}>
                <span className="h-[22px] w-[30px] border-2 border-b-0 border-current" style={{ borderRadius: `${r}px ${r}px 0 0` }} />
                {r} px
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink2">{t.dz.spacing}</span>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t.dz.spacing}>
            {SPACING.map(([v, l, gap]) => (
              <button key={v} type="button" role="radio" aria-checked={d.spacing === v} onClick={() => set((x) => void (x.spacing = v))} className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] px-1 py-2.5 text-[13px] font-semibold ${pick(d.spacing === v)}`}>
                <span className="flex w-[34px] flex-col" style={{ gap }}>
                  <span className="h-[3px] rounded-sm bg-current" />
                  <span className="h-[3px] rounded-sm bg-current" />
                  <span className="h-[3px] rounded-sm bg-current" />
                </span>
                {t.dz[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <FontModal
        open={fontModal}
        onClose={() => setFontModal(false)}
        existing={allFonts}
        onAdd={(f) => {
          set((x) => {
            x.customFonts.push(f);
            x.fonts[role] = f.name;
          });
          setFontModal(false);
        }}
      />
    </fieldset>
  );
}

function FontModal({ open, onClose, existing, onAdd }: { open: boolean; onClose: () => void; existing: string[]; onAdd: (f: Design["customFonts"][number]) => void }) {
  const { t } = useAdmin();
  const toast = useToast();
  const [tab, setTab] = useState<"google" | "file">("google");
  const [name, setName] = useState("");
  const [file, setFile] = useState<{ src: string; name: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = () => {
    const n = name.trim();
    if (!n) return setErr(t.dz.errName);
    if (existing.some((x) => x.toLowerCase() === n.toLowerCase())) return setErr(t.dz.errDup);
    if (tab === "file" && !file) return setErr(t.dz.errFile);
    onAdd(tab === "file" ? { name: n, kind: "file", src: file!.src } : { name: n, kind: "google" });
    toast("ok", t.toast.fontAdded);
    setName("");
    setFile(null);
    setErr(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={480}
      title={t.dz.fmTitle}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.outline}>
            {t.c.cancel}
          </button>
          <button type="button" onClick={add} className={btn.primary}>
            <AIcon name="plus" />
            {t.dz.fmAdd}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 px-6 py-[18px]">
        <div className="flex w-fit gap-1 rounded-[10px] border border-line p-1" role="tablist">
          {(["google", "file"] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => (setTab(k), setErr(null))} className={`min-h-[38px] cursor-pointer rounded-[7px] border-0 px-3.5 text-sm font-semibold ${tab === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}>
              {k === "google" ? t.dz.fmGoogle : t.dz.fmUpload}
            </button>
          ))}
        </div>
        {tab === "file" && (
          <>
            <button type="button" onClick={() => input.current?.click()} className="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-dashed border-line bg-surface2 p-4 text-left text-ink hover:border-blue-solid">
              <span className="grid size-11 flex-none place-items-center rounded-[10px] bg-soft text-blue">
                <AIcon name="upload" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-[14.5px]">{t.dz.fmFile}</strong>
                <span className="break-all text-[13px] text-ink2">{file?.name ?? t.dz.fmFileHint}</span>
              </span>
            </button>
            <input
              ref={input}
              type="file"
              accept=".woff2,.woff,.ttf,.otf"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const r = await uploadFile(f, "font");
                if (!("src" in r)) return toast("err", t.toast.fontBad);
                setFile({ src: r.src, name: r.name });
                if (!name) setName(r.name.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]+/g, " "));
              }}
            />
          </>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            {t.dz.fmName} <span className="text-red">*</span>
          </span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chakra Petch" aria-invalid={!!err} className="field min-h-11" />
          {tab === "google" && <span className="text-[13px] leading-normal text-ink3">{t.dz.fmGHint}</span>}
          <FieldError text={err} />
        </label>
      </div>
    </Modal>
  );
}
