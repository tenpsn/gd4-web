"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { discardDraft, listVersions, publish, restoreVersion, saveDraft } from "@/app/admin/actions/content";
import type { Working } from "@/server/types";
import type { Category, Img, LText, Locale, Page, Section, SectionType } from "@/types/site";
import { AIcon, type AIconName } from "../AIcon";
import { useAdmin } from "../context";
import { relDate } from "../i18n";
import { MediaPicker } from "../MediaPicker";
import { CONTACT_FIELDS, newSection, RESERVED_SLUGS, SLUG_RE, TYPES } from "../sectionSchema";
import { btn, Confirm, FieldError, label, Modal, PubBar, Req, Switch, useToast, useUnsavedGuard } from "../ui";
import { DesignPanel } from "./DesignPanel";
import { getVal } from "./fields";
import { GlobalEditor } from "./GlobalEditor";
import { errKey, SectionCard, type Errors } from "./SectionCard";

type Perms = { contentEdit: boolean; contentPublish: boolean; contentDel: boolean; designView: boolean; designEdit: boolean; designPublish: boolean };
type Dev = "d" | "t" | "m";
const GLOBAL = "__global";
/** หน้าตัวอย่างแสดงที่ความกว้างจริงของแต่ละอุปกรณ์ให้ขนาดตัวอักษรและระยะห่างตรงกับของจริง แล้วย่อลงให้พอดีช่อง */
const DEV_W: Record<Dev, number> = { d: 1280, t: 820, m: 390 };

function ScaledFrame({ width, label, onScale, children }: { width: number; label: string; onScale: (s: number) => void; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // วัดขนาดทันทีด้วย เพราะ ResizeObserver ไม่แจ้งค่าตอนแท็บอยู่เบื้องหลัง
    setAvail(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => setAvail(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = avail ? Math.min(1, avail / width) : 1;
  useEffect(() => onScale(scale), [scale, onScale]);
  return (
    <div ref={box} className="relative h-[calc(100dvh-260px)] min-h-[520px] overflow-hidden rounded-xl border border-line bg-[repeating-linear-gradient(135deg,var(--ph1)_0_8px,var(--ph2)_8px_16px)]">
      <div
        className="absolute left-1/2 top-0 origin-top transition-[width] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)]"
        style={{ width, height: `${100 / scale}%`, transform: `translateX(-50%) scale(${scale})` }}
      >
        {children}
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-[rgba(15,27,45,.7)] px-1.5 py-0.5 font-mono text-[11px] text-white">{label}</span>
    </div>
  );
}

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** ตรวจช่องที่ต้องกรอกของแต่ละภาษา แล้วคืนรายการข้อผิดพลาดตามส่วน รายการ ช่อง และภาษา */
function validate(w: Working): Errors {
  const e: Errors = {};
  const need = (cond: boolean, k: string) => {
    if (cond) e[k] = "errReq";
  };
  for (const p of w.pages) {
    for (const s of p.sections) {
      const def = TYPES[s.type];
      const o = s as unknown as Record<string, unknown>;
      for (const f of def.fields.filter((x) => x.req)) {
        if (f.i18n) (["th", "en"] as const).forEach((l) => need(!getVal(o, f, l).trim(), errKey(s.id, "", f.key, l)));
        else need(!getVal(o, f, "th").trim(), errKey(s.id, "", f.key, ""));
      }
      for (const it of ("items" in s ? s.items : []) as Record<string, unknown>[]) {
        for (const f of def.item?.fields.filter((x) => x.req) ?? []) {
          if (f.i18n) (["th", "en"] as const).forEach((l) => need(!getVal(it, f, l).trim(), errKey(s.id, String(it.id), f.key, l)));
          else need(!getVal(it, f, "th").trim(), errKey(s.id, String(it.id), f.key, ""));
        }
      }
    }
  }
  const c = w.global.contact as unknown as Record<string, unknown>;
  for (const f of CONTACT_FIELDS.filter((x) => x.req)) need(!getVal(c, f, "th").trim(), errKey("contact", "", f.key, ""));
  if (w.global.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(w.global.contact.email)) e[errKey("contact", "", "email", "")] = "errEmail";
  return e;
}

export function Editor({ mode, initial, hasDraft, initialRev, categories, initialPage, perms }: {
  mode: "content" | "design";
  initial: Working;
  hasDraft: boolean;
  initialRev: number;
  categories: Category[];
  initialPage: string;
  perms: Perms;
}) {
  const { lang: ui, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [w, setW] = useState<Working>(initial);
  const [savedW, setSavedW] = useState<Working>(initial);
  const [draft, setDraft] = useState(hasDraft);
  const [pageId, setPageId] = useState(initial.pages.some((p) => p.id === initialPage) ? initialPage : "home");
  const [lang, setLang] = useState<Locale>("th");
  const [openSec, setOpenSec] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [dev, setDev] = useState<Dev>("d");
  const [frameScale, setFrameScale] = useState(1);
  const [scheme, setScheme] = useState<"light" | "dark">("light");
  const [media, setMedia] = useState<{ current: Img; apply: (src: string) => void } | null>(null);
  const [addSec, setAddSec] = useState(false);
  const [pageModal, setPageModal] = useState<"new" | "edit" | null>(null);
  const [delPage, setDelPage] = useState(false);
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof listVersions>> | null>(null);
  const [restoreV, setRestoreV] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);
  const saveTimer = useRef<number | null>(null);

  const canEdit = mode === "design" ? perms.designEdit : perms.contentEdit;
  const canPublish = mode === "design" ? perms.designPublish : perms.contentPublish;
  const isGlobal = pageId === GLOBAL;
  const page = w.pages.find((p) => p.id === pageId) ?? w.pages[0];
  const unsaved = !same(w, savedW);
  useUnsavedGuard(unsaved);

  /* บันทึกฉบับร่างอัตโนมัติเมื่อหยุดพิมพ์ แล้วรีเฟรชหน้าตัวอย่าง */
  // เลขรุ่นของฉบับร่างที่หน้านี้ใช้อยู่ ถ้ามีฉบับใหม่กว่า เซิร์ฟเวอร์จะไม่ยอมให้บันทึกทับ
  const rev = useRef(initialRev);
  const [conflict, setConflict] = useState<{ who: LText; when: string } | null>(null);
  const flush = useCallback(
    async (next: Working): Promise<boolean> => {
      try {
        const r = await saveDraft(next, rev.current);
        if (!r.ok) {
          setConflict({ who: r.who, when: r.when });
          return false;
        }
        rev.current = r.rev;
        setSavedW(next);
        setDraft(true);
        frame.current?.contentWindow?.postMessage({ type: "gd4-refresh" }, window.location.origin);
        return true;
      } catch {
        toast("err", t.toast.fix);
        return false;
      }
    },
    [toast, t.toast.fix],
  );
  useEffect(() => {
    if (!unsaved || !canEdit || conflict) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => flush(w), 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [w, unsaved, canEdit, flush, conflict]);

  /* คลิกส่วนใดในหน้าตัวอย่าง จะเปิดส่วนนั้นในหน้าแก้ไข */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      // กดปุ่มเปลี่ยนภาษาบนหัวหน้าตัวอย่าง จะแก้ไขและแสดงภาษานั้น
      if (e.data?.type === "gd4-lang" && (e.data.lang === "th" || e.data.lang === "en")) {
        setLang(e.data.lang);
        return;
      }
      if (e.data?.type !== "gd4-select" || mode !== "content") return;
      const id = String(e.data.id);
      setOpenSec(id);
      setView("edit");
      window.setTimeout(() => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [mode]);
  useEffect(() => {
    if (openSec) frame.current?.contentWindow?.postMessage({ type: "gd4-focus", id: openSec }, window.location.origin);
  }, [openSec]);
  // ป้ายภาษาข้างแต่ละช่อง ใช้สลับภาษาที่กำลังแก้ไข
  useEffect(() => {
    const onLang = (e: Event) => setLang((e as CustomEvent<Locale>).detail);
    window.addEventListener("gd4-edit-lang", onLang);
    return () => window.removeEventListener("gd4-edit-lang", onLang);
  }, []);

  /* ตัวช่วยแก้ไขข้อมูลที่กำลังทำงานอยู่ */
  const setPage = (fn: (p: Page) => Page) => setW((x) => ({ ...x, pages: x.pages.map((p) => (p.id === page.id ? fn(p) : p)) }));
  const setSections = (fn: (s: Section[]) => Section[]) => setPage((p) => ({ ...p, sections: fn(p.sections) }));
  const reErr = (next: Working) => Object.keys(errors).length && setErrors(validate(next));
  const change = (next: Working) => {
    setW(next);
    reErr(next);
  };

  const withUndo = (next: Working, msg: string) => {
    const before = w;
    change(next);
    toast("ok", msg, { label: t.c.undo, run: () => (setW(before), toast("ok", t.toast.undone)) });
  };

  const moveSec = (from: number, to: number) =>
    setSections((list) => {
      if (to < 0 || to >= list.length) return list;
      const n = [...list];
      const [x] = n.splice(from, 1);
      n.splice(to, 0, x);
      return n;
    });
  const dragFrom = useRef<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  /* เผยแพร่ บันทึกฉบับร่าง และประวัติรุ่น */
  const doPublish = () => {
    const e = validate(w);
    if (Object.keys(e).length) {
      setErrors(e);
      const [sec, , , l] = Object.keys(e)[0].split("|");
      const pg = sec === "contact" ? w.pages.find((p) => p.sections.some((s) => s.type === "contact")) : w.pages.find((p) => p.sections.some((s) => s.id === sec));
      if (pg) setPageId(pg.id);
      if (l === "th" || l === "en") setLang(l);
      setOpenSec(sec === "contact" ? pg?.sections.find((s) => s.type === "contact")?.id ?? null : sec);
      toast("err", t.toast.fix);
      return;
    }
    start(async () => {
      if (unsaved && !(await flush(w))) return;
      const r = await publish();
      if (!r.ok) return toast("err", ui === "th" ? "บัญชีนี้ไม่มีสิทธิ์เผยแพร่" : "This account cannot publish");
      if (r.rev !== undefined) rev.current = r.rev;
      setDraft(false);
      setSavedW(w);
      toast("ok", t.toast.pub);
      router.refresh();
    });
  };
  const doSaveDraft = () =>
    start(async () => {
      if (await flush(w)) toast("ok", t.toast.draft);
    });

  const pubState = unsaved ? "unsaved" : draft ? "unsaved" : "saved";
  const status = draft || unsaved ? { tone: "bg-amber-soft text-amber", label: t.content.stDraft } : { tone: "bg-green-soft text-green", label: t.content.stPub };

  /* กรอบแสดงหน้าตัวอย่าง */
  const previewSrc = `/preview/${isGlobal ? "home" : page.id}?lang=${lang}&theme=${scheme}`;
  const preview = (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex gap-0.5 rounded-lg border border-line bg-surface p-[3px]" role="tablist">
          {(
            [
              ["d", "monitor", t.content.pvDesktop],
              ["t", "tablet", t.content.pvTablet],
              ["m", "mobile", t.content.pvMobile],
            ] as [Dev, AIconName, string][]
          ).map(([k, icon, l]) => (
            <button key={k} type="button" role="tab" aria-selected={dev === k} onClick={() => setDev(k)} title={l} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border-0 px-2.5 text-[13px] font-semibold ${dev === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}>
              <AIcon name={icon} size={16} />
              <span className="hidden min-[1500px]:inline">{l}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-lg border border-line bg-surface p-[3px]">
          {(["light", "dark"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setScheme(m)} aria-pressed={scheme === m} aria-label={t.dz[m]} title={t.dz[m]} className={`grid size-9 cursor-pointer place-items-center rounded-md border-0 ${scheme === m ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}>
              <AIcon name={m === "light" ? "sun" : "moon"} size={16} />
            </button>
          ))}
        </div>
        <span className="flex-1 text-[13px] text-ink3">{mode === "content" ? t.content.pvHint : ""}</span>
        <a href={isGlobal ? "/" : page.slug} target="_blank" rel="noopener noreferrer" className={`${btn.link} text-[13px]`}>
          <AIcon name="external" size={15} />
          {t.nav.viewSite}
        </a>
      </div>
      <ScaledFrame width={DEV_W[dev]} label={`${DEV_W[dev]}px${frameScale < 1 ? ` · ${Math.round(frameScale * 100)}%` : ""}`} onScale={setFrameScale}>
        <iframe ref={frame} key={previewSrc} src={previewSrc} title={t.content.live} className="block size-full border-0 bg-white" />
      </ScaledFrame>
    </div>
  );

  /* คอลัมน์แก้ไขเนื้อหา */
  const editor =
    mode === "design" ? (
      <DesignPanel d={w.design} onChange={(design) => change({ ...w, design })} dev={dev} setDev={setDev} scheme={scheme} setScheme={setScheme} canEdit={canEdit} />
    ) : (
      <div className="flex min-w-0 flex-col gap-3">
        {/* ติดอยู่ด้านบนตลอดขณะเลื่อนดูรายการส่วน */}
        <div className="card sticky -top-4 z-10 flex items-center md2:-top-7 justify-between gap-3 py-0 pl-4 pr-2 shadow-[0_8px_16px_-12px_rgba(15,27,45,.35)]">
          <span className="text-[13.5px] font-medium text-ink2">{t.content.editingLang}</span>
          <div role="tablist" className="flex gap-0.5">
            {(["th", "en"] as const).map((l) => {
              const err = Object.keys(errors).some((k) => k.endsWith(`|${l}`));
              return (
                <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)} className={`relative flex min-h-12 cursor-pointer items-center gap-2 border-0 bg-transparent px-3.5 text-[14.5px] font-semibold transition-colors ${lang === l ? "text-ink" : "text-ink3"}`}>
                  {l === "th" ? t.c.th : t.c.en}
                  {err && <span className="size-[7px] rounded-full bg-red" />}
                  <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-sm bg-brand-red transition-transform duration-300 ${lang === l ? "scale-x-100" : "scale-x-0"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {isGlobal ? (
          <GlobalEditor g={w.global} lang={lang} canEdit={canEdit} onChange={(global) => change({ ...w, global })} />
        ) : (
          <>
            {page.sections.length === 0 && (
              <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="text-[15px] text-ink2">{t.content.noSecs}</span>
                {canEdit && (
                  <button type="button" onClick={() => setAddSec(true)} className={btn.primary}>
                    <AIcon name="plus" />
                    {t.content.addFirstSec}
                  </button>
                )}
              </div>
            )}
            {page.sections.map((s, i) => (
              <SectionCard
                key={s.id}
                s={s}
                n={i + 1}
                open={openSec === s.id}
                onToggle={() => setOpenSec(openSec === s.id ? null : s.id)}
                onChange={(ns) => change({ ...w, pages: w.pages.map((p) => (p.id === page.id ? { ...p, sections: p.sections.map((x) => (x.id === s.id ? ns : x)) } : p)) })}
                onDup={() => {
                  const c = { ...structuredClone(s), id: uid("s") } as Section;
                  if ("items" in c) (c as { items: { id: string }[] }).items.forEach((it) => (it.id = uid("i")));
                  setSections((list) => [...list.slice(0, i + 1), c, ...list.slice(i + 1)]);
                  toast("ok", t.toast.duped);
                }}
                onDelete={() => withUndo({ ...w, pages: w.pages.map((p) => (p.id === page.id ? { ...p, sections: p.sections.filter((x) => x.id !== s.id) } : p)) }, t.toast.delOk)}
                onMove={(d) => moveSec(i, i + d)}
                drag={{
                  dragging: dragging === s.id,
                  onStart: () => {
                    dragFrom.current = i;
                    setDragging(s.id);
                  },
                  onEnter: () => {
                    if (dragFrom.current !== null && dragFrom.current !== i) {
                      moveSec(dragFrom.current, i);
                      dragFrom.current = i;
                    }
                  },
                  onEnd: () => {
                    dragFrom.current = null;
                    setDragging(null);
                  },
                }}
                lang={lang}
                errors={errors}
                categories={categories}
                onPickMedia={(current, apply) => setMedia({ current, apply })}
                contact={w.global.contact}
                onContact={(contact) => change({ ...w, global: { ...w.global, contact } })}
                canEdit={canEdit}
                canDel={perms.contentDel}
              />
            ))}
            {canEdit && page.sections.length > 0 && (
              <button type="button" onClick={() => setAddSec(true)} className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line bg-surface text-[15px] font-semibold text-blue hover:border-blue-solid hover:bg-soft">
                <AIcon name="plus" />
                {t.content.addSection}
              </button>
            )}
          </>
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <PubBar
        state={pubState}
        ctx={mode === "design" ? t.dz.title : isGlobal ? (ui === "th" ? "ส่วนกลาง" : "Site-wide") : page.title[ui]}
        busy={pending}
        canDraft={canEdit}
        canPublish={canPublish}
        onDraft={doSaveDraft}
        onPublish={doPublish}
        extra={
          <button
            type="button"
            onClick={async () => setVersions(await listVersions())}
            aria-label={t.content.versions}
            title={t.content.versions}
            className="grid size-10 flex-none cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink2 hover:border-blue-solid hover:text-blue"
          >
            <AIcon name="history" />
          </button>
        }
      />

      {conflict && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber bg-amber-soft px-4 py-3 text-amber [animation:a-up_.3s_both]">
          <AIcon name="alert" size={20} />
          <span className="min-w-[220px] flex-1 text-[14.5px] font-medium leading-normal">
            {ui === "th"
              ? `ฉบับร่างถูกแก้ไขจากหน้าต่างอื่น (${conflict.who.th}${conflict.when ? ` · ${relDate(conflict.when, "th")}` : ""}) จึงหยุดบันทึกอัตโนมัติเพื่อไม่ให้เขียนทับกัน โหลดฉบับล่าสุดก่อนแก้ต่อ`
              : `The draft was changed in another window (${conflict.who.en}${conflict.when ? ` · ${relDate(conflict.when, "en")}` : ""}). Autosave is paused so nothing is overwritten. Load the latest version to continue.`}
          </span>
          <button type="button" onClick={() => window.location.reload()} className={`${btn.primary} min-h-10 text-sm`}>
            <AIcon name="undo" />
            {ui === "th" ? "โหลดฉบับล่าสุด" : "Load latest"}
          </button>
        </div>
      )}

      <div className="anim-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[620px] flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-[clamp(22px,3vw,28px)] font-bold">{mode === "design" ? t.nav.design : t.content.title}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold ${status.tone}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          </div>
          <p className="m-0 text-[15px] leading-[1.6] text-ink2">{mode === "design" ? t.dz.sub : t.content.sub}</p>
        </div>
        {draft && canEdit && (
          <button
            type="button"
            onClick={() =>
              start(async () => {
                await discardDraft();
                toast("ok", ui === "th" ? "ยกเลิกฉบับร่างแล้ว" : "Draft discarded");
                router.refresh();
                window.location.reload();
              })
            }
            className={`${btn.outline} min-h-10 text-sm hover:border-red hover:text-red`}
          >
            <AIcon name="undo" />
            {ui === "th" ? "ยกเลิกฉบับร่าง" : "Discard draft"}
          </button>
        )}
      </div>

      <div className="flex w-fit max-w-full gap-1 rounded-[10px] border border-line bg-surface p-1">
        {(
          [
            ["content", "/admin/content", "page", t.dz.modeContent, true],
            ["design", "/admin/design", "text", t.dz.modeDesign, perms.designView],
          ] as const
        )
          .filter((m) => m[4])
          .map(([k, href, icon, l]) => (
            <Link key={k} href={href} aria-current={mode === k ? "page" : undefined} className={`inline-flex min-h-[42px] items-center gap-2 rounded-[7px] px-4 text-[14.5px] font-semibold transition-colors ${mode === k ? "bg-blue-solid text-white hover:text-white" : "text-ink2 hover:text-blue"}`}>
              <AIcon name={icon} />
              {l}
            </Link>
          ))}
      </div>

      {mode === "content" && (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-[10px] border border-line bg-surface p-1" role="tablist">
              {[...w.pages.map((p) => ({ id: p.id, label: p.title[ui] || p.title.th })), { id: GLOBAL, label: ui === "th" ? "ส่วนกลาง" : "Site-wide" }].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={pageId === p.id}
                  onClick={() => (setPageId(p.id), setOpenSec(null))}
                  className={`inline-flex min-h-10 flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] border-0 px-3.5 text-[14.5px] font-semibold transition-colors ${pageId === p.id ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}
                >
                  {p.id === GLOBAL && <AIcon name="globe" size={16} />}
                  {p.label}
                </button>
              ))}
            </div>
            {canEdit && (
              <button type="button" onClick={() => setPageModal("new")} className="inline-flex min-h-[50px] flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[10px] border-[1.5px] border-dashed border-line bg-surface px-3.5 text-[14.5px] font-semibold text-blue hover:border-blue-solid">
                <AIcon name="plus" />
                <span className="hidden md2:inline">{t.content.addPage}</span>
              </button>
            )}
          </div>
          {isGlobal ? (
            <div className="flex items-center gap-2.5 rounded-[10px] bg-soft px-3.5 py-3 text-sm font-medium text-blue">
              <AIcon name="globe" />
              {t.content.globalNote}
            </div>
          ) : (
            <div className="card flex flex-wrap items-center gap-2.5 rounded-[10px] py-2 pl-3.5 pr-2">
              <span className="inline-flex min-w-0 flex-[1_1_200px] items-center gap-2 font-mono text-[13.5px] font-medium text-ink2">
                <span className="grid text-ink3">
                  <AIcon name="globe" />
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">gdfourmedical.com{page.slug === "/" ? "" : page.slug}</span>
              </span>
              <span className={`rounded-full px-2.5 py-[3px] text-[12.5px] font-semibold ${page.inMenu ? "bg-green-soft text-green" : "bg-surface2 text-ink2"}`}>{page.inMenu ? t.content.inMenu : t.content.notInMenu}</span>
              {canEdit && (
                <button type="button" onClick={() => setPageModal("edit")} className={`${btn.outline} min-h-[38px] px-3 text-sm`}>
                  <AIcon name="gear" />
                  {t.content.pageSettings}
                </button>
              )}
              {perms.contentDel && !page.system && (
                <button type="button" onClick={() => setDelPage(true)} aria-label={t.content.delPage} title={t.content.delPage} className="grid size-[38px] cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-red hover:bg-red-soft">
                  <AIcon name="trash" />
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* จอแคบ ใช้สลับระหว่างหน้าแก้ไขกับหน้าตัวอย่าง */}
      <div className="flex w-fit gap-1 rounded-[10px] border border-line bg-surface p-1 min-[1280px]:hidden">
        {(
          [
            ["edit", "edit", t.content.editTab],
            ["preview", "eye", t.content.previewTab],
          ] as const
        ).map(([k, icon, l]) => (
          <button key={k} type="button" onClick={() => setView(k)} aria-pressed={view === k} className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-[7px] border-0 px-4 text-[14.5px] font-semibold ${view === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"}`}>
            <AIcon name={icon} />
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className={view === "edit" ? "" : "hidden min-[1280px]:block"}>{editor}</div>
        <div className={`min-[1280px]:sticky min-[1280px]:top-0 ${view === "preview" ? "" : "hidden min-[1280px]:block"}`}>{preview}</div>
      </div>

      {/* หน้าต่างป๊อปอัป */}
      <MediaPicker open={!!media} current={media?.current ?? null} onPick={(src) => media?.apply(src)} onClose={() => setMedia(null)} />

      <Modal open={addSec} onClose={() => setAddSec(false)} width={760} title={t.content.pickType} sub={t.content.pickTypeSub}>
        <div className="flex flex-col gap-5 px-6 pb-6 pt-[18px]">
          {(["basic", "special"] as const).map((g) => (
            <div key={g} className="flex flex-col gap-2.5">
              <span className="text-[13px] font-semibold tracking-[.02em] text-ink3">{g === "basic" ? t.content.gBasic : t.content.gSpecial}</span>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-2.5">
                {(Object.entries(TYPES) as [SectionType, (typeof TYPES)[SectionType]][])
                  .filter(([, d]) => d.group === g)
                  .map(([type, d]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const s = newSection(type, uid("s"));
                        setSections((list) => [...list, s]);
                        setAddSec(false);
                        setOpenSec(s.id);
                        toast("ok", t.toast.secAdded);
                        window.setTimeout(() => document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
                      }}
                      className="flex min-h-[72px] cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-line bg-surface p-3.5 text-left text-ink transition-[border-color,transform,box-shadow] duration-[250ms] hover:-translate-y-0.5 hover:border-blue-solid hover:shadow-lift"
                    >
                      <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-soft text-blue">
                        <AIcon name={d.icon} />
                      </span>
                      <span className="flex flex-col gap-[3px]">
                        <strong className="text-[14.5px] font-semibold">{d.name[ui]}</strong>
                        <span className="text-[13px] leading-[1.45] text-ink2">{d.desc[ui]}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {pageModal && (
        <PageModal
          mode={pageModal}
          page={pageModal === "edit" ? page : null}
          pages={w.pages}
          onClose={() => setPageModal(null)}
          onSave={(meta) => {
            if (pageModal === "new") {
              const id = meta.slug.slice(1).replace(/\//g, "-");
              const np: Page = { id: w.pages.some((p) => p.id === id) ? uid("p") : id, ...meta, system: false, sections: [newSection("pageHeader", uid("s"))] };
              (np.sections[0] as { heading: LText }).heading = { ...meta.title };
              change({ ...w, pages: [...w.pages, np] });
              setPageId(np.id);
              toast("ok", t.toast.pageAdded);
            } else {
              setPage((p) => ({ ...p, title: meta.title, inMenu: meta.inMenu, slug: p.system ? p.slug : meta.slug }));
              toast("ok", t.toast.pageSaved);
            }
            setPageModal(null);
          }}
        />
      )}

      <Confirm
        open={delPage}
        onClose={() => setDelPage(false)}
        onOk={() => {
          setDelPage(false);
          setPageId("home");
          withUndo({ ...w, pages: w.pages.filter((p) => p.id !== page.id) }, t.toast.delOk);
        }}
        title={t.cf.delPageTitle}
        text={t.cf.undoText}
        items={[page.title[ui]]}
        okLabel={t.c.del}
      />

      <Modal open={!!versions} onClose={() => setVersions(null)} width={560} title={t.content.vTitle} sub={t.content.vSub}>
        <div className="flex flex-col px-6 pb-[22px] pt-2.5">
          {versions?.map((v, i) => (
            <div key={v.v} className="flex items-center gap-3.5 border-b border-line py-3.5">
              <span className="w-10 font-mono text-[13px] font-semibold text-blue">v{v.v}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="text-[14.5px] font-semibold">{v.note[ui]}</strong>
                <span className="text-[13px] text-ink2">
                  {v.who[ui]} · {relDate(v.when, ui)}
                </span>
              </span>
              {i === 0 ? (
                <span className="rounded-full bg-green-soft px-2.5 py-[3px] text-[12.5px] font-semibold text-green">{t.content.current}</span>
              ) : (
                canEdit && (
                  <button type="button" onClick={() => setRestoreV(v.v)} className={`${btn.outline} min-h-[38px] px-3 text-sm`}>
                    <AIcon name="undo" />
                    {t.content.restore}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </Modal>
      <Confirm
        open={restoreV !== null}
        onClose={() => setRestoreV(null)}
        onOk={() =>
          start(async () => {
            const v = restoreV!;
            setRestoreV(null);
            setVersions(null);
            const r = await restoreVersion(v);
            if (!r.ok) return toast("err", t.toast.fix);
            toast("ok", t.toast.restored);
            window.location.reload();
          })
        }
        title={t.cf.restoreTitle}
        text={t.content.vSub}
        okLabel={t.cf.restoreOk}
        danger={false}
        icon="undo"
      />
    </div>
  );
}

function PageModal({ mode, page, pages, onClose, onSave }: {
  mode: "new" | "edit";
  page: Page | null;
  pages: Page[];
  onClose: () => void;
  onSave: (m: { title: LText; slug: string; inMenu: boolean }) => void;
}) {
  const { t } = useAdmin();
  const [th, setTh] = useState(page?.title.th ?? "");
  const [en, setEn] = useState(page?.title.en ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "/");
  const [inMenu, setInMenu] = useState(page?.inMenu ?? true);
  const [err, setErr] = useState<Partial<Record<"th" | "en" | "slug", string>>>({});
  const system = !!page?.system;

  const save = () => {
    const e: typeof err = {};
    if (!th.trim()) e.th = t.content.errReq;
    if (!en.trim()) e.en = t.content.errReq;
    if (!system) {
      if (!SLUG_RE.test(slug)) e.slug = t.content.errSlug;
      else if (pages.some((p) => p.slug === slug && p.id !== page?.id) || RESERVED_SLUGS.includes(slug)) e.slug = t.content.errSlugDup;
    }
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ title: { th: th.trim(), en: en.trim() }, slug, inMenu });
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={520}
      title={mode === "new" ? t.content.newPage : t.content.editPage}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.outline}>
            {t.c.cancel}
          </button>
          <button type="button" onClick={save} className={btn.primary}>
            {t.c.save}
          </button>
        </>
      }
    >
      <form onSubmit={(e) => (e.preventDefault(), save())} className="flex flex-col gap-4 px-6 py-5">
        <label className="flex flex-col gap-1.5">
          <span className={label}>
            {t.content.pTh}
            <Req />
          </span>
          <input value={th} onChange={(e) => setTh(e.target.value)} aria-invalid={!!err.th} className="field min-h-11" lang="th" />
          <FieldError text={err.th} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>
            {t.content.pEn}
            <Req />
          </span>
          <input value={en} onChange={(e) => setEn(e.target.value)} aria-invalid={!!err.en} className="field min-h-11" lang="en" />
          <FieldError text={err.en} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>
            {t.content.pSlug}
            <Req />
          </span>
          <span className={`flex items-center overflow-hidden rounded-lg border bg-field ${err.slug ? "border-red" : "border-line"}`}>
            <span className="pl-3 font-mono text-sm font-medium text-ink3">gdfourmedical.com</span>
            <input
              value={slug}
              disabled={system}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              aria-invalid={!!err.slug}
              className="min-h-11 min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 font-mono text-sm font-medium text-ink outline-none disabled:opacity-60"
            />
          </span>
          <FieldError text={err.slug} />
          <span className="text-[13px] text-ink3">{system ? t.content.systemPage : t.content.pSlugHint}</span>
        </label>
        <Switch on={inMenu} onChange={setInMenu} label={t.content.pMenu} hint={t.content.pMenuHint} disabled={system} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
