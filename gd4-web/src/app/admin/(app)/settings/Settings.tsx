"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AIcon, type AIconName } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { fmtDate, relDate } from "@/admin/i18n";
import { MediaPicker } from "@/admin/MediaPicker";
import { btn, Confirm, FieldError, fmtSize, label, pageTitle, Req, uploadFile, useToast } from "@/admin/ui";
import type { Backup } from "@/server/types";
import type { Design, Img, LText, Locale, Page, SiteLanguage, SiteSettings } from "@/types/site";
import { restoreVersion } from "../../actions/content";
import {
  backupNow, changePassword, restoreBackup, saveGeneral, saveLanguages, saveSeo, setAutoBackup, type PwErrors,
} from "../../actions/settings";

type Tab = "general" | "typo" | "theme" | "seo" | "lang" | "security" | "backup";
const TABS: [Tab, AIconName][] = [
  ["general", "gear"], ["typo", "text"], ["theme", "sun"], ["seo", "search"], ["lang", "globe"], ["security", "lock"], ["backup", "download"],
];

type PageLite = Pick<Page, "id" | "title" | "slug" | "seo">;
type VersionLite = { v: number; when: string; userId: number; note: LText };

export function Settings(props: {
  full: boolean;
  canEdit: boolean;
  canDesign: boolean;
  settings: SiteSettings;
  pages: PageLite[];
  design: Design;
  backups: Backup[];
  versions: VersionLite[];
  users: Record<number, LText>;
  email: string;
}) {
  const { t } = useAdmin();
  const tabs = props.full ? TABS : TABS.filter(([k]) => k === "security");
  const [tab, setTab] = useState<Tab>(props.full ? "general" : "security");

  return (
    <div className="flex flex-col gap-[18px]">
      <h1 className={`${pageTitle} anim-up`}>{t.set.title}</h1>
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-surface p-1" role="tablist">
        {tabs.map(([k, icon]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`inline-flex min-h-[42px] flex-none cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] border-0 px-3.5 text-[14.5px] font-semibold transition-colors ${
              tab === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"
            }`}
          >
            <AIcon name={icon} />
            {t.set[`t_${k}`]}
          </button>
        ))}
      </div>
      <fieldset disabled={!props.canEdit && tab !== "security"} className="m-0 flex min-w-0 flex-col gap-[18px] border-0 p-0">
        {tab === "general" && <General settings={props.settings} />}
        {tab === "typo" && <TypoSummary design={props.design} canDesign={props.canDesign} />}
        {tab === "theme" && <ThemeSummary design={props.design} canDesign={props.canDesign} />}
        {tab === "seo" && <Seo settings={props.settings} pages={props.pages} />}
        {tab === "lang" && <Languages list={props.settings.languages} />}
        {tab === "security" && <Security />}
        {tab === "backup" && <Backups backups={props.backups} versions={props.versions} users={props.users} auto={props.settings.autoBackup} />}
      </fieldset>
    </div>
  );
}

function LangTabs({ value, onChange, errs }: { value: Locale; onChange: (l: Locale) => void; errs?: Partial<Record<Locale, boolean>> }) {
  const { t } = useAdmin();
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={value === l}
          onClick={() => onChange(l)}
          className={`relative flex min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent px-3 text-[14.5px] font-semibold ${value === l ? "text-ink" : "text-ink3"}`}
        >
          {l === "th" ? t.c.th : t.c.en}
          {errs?.[l] && <span className="size-[7px] rounded-full bg-red" />}
          <span className={`absolute inset-x-1.5 -bottom-px h-0.5 rounded-sm bg-brand-red transition-transform duration-300 ${value === l ? "scale-x-100" : "scale-x-0"}`} />
        </button>
      ))}
    </div>
  );
}

/** อัปโหลดหรือลบรูปในหน้าตั้งค่า เช่น โลโก้และไอคอนเว็บ */
function ImageSetting({ title, hint, value, onChange, preview }: { title: string; hint: string; value: Img; onChange: (v: Img) => void; preview: React.ReactNode }) {
  const { t } = useAdmin();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="card flex flex-col gap-3 p-[18px]">
      <strong className="text-[15px]">{title}</strong>
      {preview}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => input.current?.click()} className={`${btn.outline} min-h-10 px-3.5 text-sm`}>
          <AIcon name="upload" />
          {t.set.upload}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="min-h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3 text-sm text-red">
            {t.set.remove}
          </button>
        )}
      </div>
      <span className="text-[13px] text-ink3">{hint}</span>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const r = await uploadFile(f, "image");
          if ("src" in r) {
            onChange(r.src);
            toast("ok", t.toast.logo);
          } else toast("err", t.toast.imgOnly);
        }}
      />
    </section>
  );
}

function SaveRow({ onSave, pending, dirty }: { onSave: () => void; pending: boolean; dirty: boolean }) {
  const { t } = useAdmin();
  return (
    <div className="flex items-center justify-end gap-3">
      {dirty && (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber">
          <span className="size-[7px] rounded-full bg-current" />
          {t.c.unsaved}
        </span>
      )}
      <button type="button" onClick={onSave} disabled={pending || !dirty} className={btn.primary}>
        {t.set.saveSet}
      </button>
    </div>
  );
}

function General({ settings }: { settings: SiteSettings }) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const init = { siteName: settings.siteName, logo: settings.logo, logoDark: settings.logoDark, favicon: settings.favicon };
  const [v, setV] = useState(init);
  const [saved, setSaved] = useState(init);
  const [nl, setNl] = useState<Locale>(lang);
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  const bg = (s: Img) => (s ? { backgroundImage: `url(${s})` } : undefined);

  const save = () => {
    if (!v.siteName.th.trim() || !v.siteName.en.trim()) {
      setErr(true);
      setNl(!v.siteName.th.trim() ? "th" : "en");
      return;
    }
    start(async () => {
      const r = await saveGeneral(v);
      if (!r.ok) return setErr(true);
      setErr(false);
      setSaved(v);
      toast("ok", t.toast.setSaved);
      router.refresh();
    });
  };

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4 [animation:a-up_.4s_both]">
        <ImageSetting
          title={t.set.logoLight}
          hint={t.set.logoHint}
          value={v.logo}
          onChange={(logo) => setV({ ...v, logo })}
          preview={
            <div className="grid h-[120px] place-items-center rounded-[10px] border border-line bg-white">
              {v.logo ? (
                <span className="h-[70%] w-[80%] bg-contain bg-center bg-no-repeat" style={bg(v.logo)} />
              ) : (
                <span className="flex items-center gap-2.5 text-[#0f1b2d]">
                  <span className="grid size-11 place-items-center rounded-lg bg-[#1a4fa0] font-bold text-white">GD4</span>
                  <strong>{v.siteName[lang]}</strong>
                </span>
              )}
            </div>
          }
        />
        <ImageSetting
          title={t.set.logoDark}
          hint={t.set.logoHint}
          value={v.logoDark}
          onChange={(logoDark) => setV({ ...v, logoDark })}
          preview={
            <div className="grid h-[120px] place-items-center rounded-[10px] border border-line bg-[#0b111b]">
              {v.logoDark ? (
                <span className="h-[70%] w-[80%] bg-contain bg-center bg-no-repeat" style={bg(v.logoDark)} />
              ) : (
                <span className="flex items-center gap-2.5 text-white">
                  <span className="grid size-11 place-items-center rounded-lg bg-[#2a5fb8] font-bold text-white">GD4</span>
                  <strong>{v.siteName[lang]}</strong>
                </span>
              )}
            </div>
          }
        />
        <ImageSetting
          title={t.set.favicon}
          hint={t.set.favHint}
          value={v.favicon}
          onChange={(favicon) => setV({ ...v, favicon })}
          preview={
            <div className="flex h-[120px] items-end rounded-[10px] border border-line bg-surface2 px-3.5">
              <span className="flex w-full max-w-60 items-center gap-2 rounded-t-[10px] border border-b-0 border-line bg-surface px-3 py-2.5">
                <span className="grid size-[18px] flex-none place-items-center overflow-hidden rounded bg-[#1a4fa0] bg-cover bg-center text-[8px] font-bold text-white" style={bg(v.favicon)}>
                  {!v.favicon && "G"}
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]">{v.siteName[lang]}</span>
              </span>
            </div>
          }
        />
      </div>
      <section className="card flex max-w-[720px] flex-col gap-3.5 px-5 py-[18px]">
        <LangTabs value={nl} onChange={setNl} errs={{ th: err && !v.siteName.th.trim(), en: err && !v.siteName.en.trim() }} />
        <label className="flex flex-col gap-1.5">
          <span className={label}>
            {t.set.siteName}
            <Req />
          </span>
          <input value={v.siteName[nl]} onChange={(e) => setV({ ...v, siteName: { ...v.siteName, [nl]: e.target.value } })} aria-invalid={err && !v.siteName[nl].trim()} className="field min-h-11" />
          <FieldError text={err && !v.siteName[nl].trim() && t.set.errName} />
        </label>
      </section>
      <SaveRow onSave={save} pending={pending} dirty={dirty} />
    </>
  );
}

const SIZE_ROWS = ["h1", "h2", "h3", "body", "btn", "menu"] as const;

function TypoSummary({ design, canDesign }: { design: Design; canDesign: boolean }) {
  const { t } = useAdmin();
  const fontCss = (n: string) => `'${n}','IBM Plex Sans Thai',sans-serif`;
  return (
    <section className="card flex flex-col gap-4 p-5 [animation:a-up_.4s_both]">
      <SummaryHead title={t.set.typoSum} sub={t.set.sumHint} canDesign={canDesign} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
        {(
          [
            [t.dz.fHeading, design.fonts.heading],
            [t.dz.fBody, design.fonts.body],
          ] as const
        ).map(([l, f]) => (
          <div key={l} className="flex flex-col gap-1.5 rounded-[10px] border border-line p-4">
            <span className="text-[13px] text-ink2">{l}</span>
            <span className="text-[26px] leading-[1.2]" style={{ fontFamily: fontCss(f) }}>
              Aa กขค
            </span>
            <strong className="text-sm">{f}</strong>
          </div>
        ))}
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-ink2">
              <th className="py-2 font-semibold">{t.dz.sizes}</th>
              <th className="p-2 text-right font-semibold">{t.set.dev_d}</th>
              <th className="p-2 text-right font-semibold">{t.set.dev_t}</th>
              <th className="py-2 pl-2 text-right font-semibold">{t.set.dev_m}</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((k) => (
              <tr key={k} className="border-t border-line">
                <td className="py-2.5">{t.dz[`s_${k}`]}</td>
                <td className="px-2 py-2.5 text-right font-mono text-[13.5px] font-medium">{design.sizes[k].d}px</td>
                <td className="px-2 py-2.5 text-right font-mono text-[13.5px] font-medium">{design.sizes[k].t}px</td>
                <td className="py-2.5 pl-2 text-right font-mono text-[13.5px] font-medium">{design.sizes[k].m}px</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryHead({ title, sub, canDesign }: { title: string; sub: string; canDesign: boolean }) {
  const { t } = useAdmin();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex flex-[1_1_260px] flex-col gap-[3px]">
        <strong className="text-base">{title}</strong>
        <span className="text-[13.5px] text-ink2">{sub}</span>
      </span>
      {canDesign && (
        <Link href="/admin/design" className={`${btn.primary} text-[14.5px]`}>
          <AIcon name="eye" />
          {t.set.openEditor}
        </Link>
      )}
    </div>
  );
}

const COLOR_ROWS = ["primary", "accent", "bg", "bg2", "heading", "text", "muted"] as const;

function ThemeSummary({ design, canDesign }: { design: Design; canDesign: boolean }) {
  const { lang, t } = useAdmin();
  const sp = design.spacing < 0.95 ? t.dz.sp_c : design.spacing > 1.05 ? t.dz.sp_r : t.dz.sp_n;
  const shape = lang === "th" ? `มุมโค้ง ${design.radius}px · ระยะห่าง ${sp}` : `Radius ${design.radius}px · Spacing ${sp}`;
  return (
    <section className="card flex flex-col gap-4 p-5 [animation:a-up_.4s_both]">
      <SummaryHead title={t.set.themeSum} sub={shape} canDesign={canDesign} />
      {(["light", "dark"] as const).map((m) => (
        <div key={m} className="flex flex-col gap-2">
          <strong className="text-sm">{t.dz[m]}</strong>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
            {COLOR_ROWS.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <span className="h-12 rounded-lg border border-line" style={{ background: design.colors[m][k] }} />
                <span className="text-[12.5px] text-ink2">{t.dz[`c_${k}`]}</span>
                <span className="font-mono text-[11.5px] font-medium text-ink3">{design.colors[m][k]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function Seo({ settings, pages }: { settings: SiteSettings; pages: PageLite[] }) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState("site");
  const [nl, setNl] = useState<Locale>(lang);
  const [picker, setPicker] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const empty = { title: { th: "", en: "" }, description: { th: "", en: "" }, image: null as Img };
  const fromSrc = (id: string) => {
    const s = id === "site" ? settings.seo : pages.find((p) => p.id === id)?.seo;
    return { title: { ...empty.title, ...s?.title }, description: { ...empty.description, ...s?.description }, image: s?.image ?? null };
  };
  const [all, setAll] = useState<Record<string, ReturnType<typeof fromSrc>>>(() =>
    Object.fromEntries(["site", ...pages.map((p) => p.id)].map((id) => [id, fromSrc(id)])),
  );
  const [saved, setSaved] = useState(all);
  const v = all[target];
  const set = (patch: Partial<typeof v>) => setAll((a) => ({ ...a, [target]: { ...a[target], ...patch } }));
  const dirty = JSON.stringify(v) !== JSON.stringify(saved[target]);

  const page = pages.find((p) => p.id === target);
  const siteTitle = settings.seo.title[nl];
  const gTitle = v.title[nl] || (page ? `${page.title[nl]} · ${settings.siteName[nl]}` : siteTitle);
  const gDesc = v.description[nl] || settings.seo.description[nl];
  const url = `gdfourmedical.com${nl === "en" ? "/en" : ""}${page && page.slug !== "/" ? page.slug : ""}`;
  const imgBg = v.image ? `center/cover no-repeat url(${v.image})` : "repeating-linear-gradient(135deg,var(--ph1) 0 8px,var(--ph2) 8px 16px)";
  const count = (s: string, max: number) => (
    <span className={`font-mono text-[12.5px] font-medium ${s.length > max ? "text-red" : "text-ink3"}`}>
      {s.length}/{max}
    </span>
  );

  return (
    <>
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-surface p-1">
        {[["site", lang === "th" ? "ทั้งเว็บไซต์" : "Whole site"] as const, ...pages.map((p) => [p.id, p.title[lang]] as const)].map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTarget(id)}
            aria-pressed={target === id}
            className={`inline-flex min-h-[38px] flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] border-0 px-3 text-sm font-semibold ${
              target === id ? "bg-blue-solid text-white" : "bg-transparent text-ink2"
            }`}
          >
            {lbl}
            {(all[id].title.th || all[id].description.th) && id !== "site" && <span className="size-1.5 rounded-full bg-green-solid" />}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4 [animation:a-up_.4s_both]">
        <section className="card flex flex-col gap-3.5 px-5 py-[18px]">
          <LangTabs value={nl} onChange={setNl} />
          <label className="flex flex-col gap-1.5">
            <span className="flex justify-between gap-2.5">
              <span className={label}>{t.set.seoTitle}</span>
              {count(v.title[nl], 60)}
            </span>
            <input value={v.title[nl]} onChange={(e) => set({ title: { ...v.title, [nl]: e.target.value } })} placeholder={page ? `${page.title[nl]} · ${settings.siteName[nl]}` : ""} className="field min-h-11" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex justify-between gap-2.5">
              <span className={label}>{t.set.seoDesc}</span>
              {count(v.description[nl], 160)}
            </span>
            <textarea rows={3} value={v.description[nl]} onChange={(e) => set({ description: { ...v.description, [nl]: e.target.value } })} placeholder={settings.seo.description[nl]} className="field resize-y text-[14.5px] leading-[1.6]" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={label}>{t.set.seoShare}</span>
            <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-field p-2">
              <span className="h-[63px] w-[120px] flex-none rounded-md border border-line" style={{ background: imgBg }} />
              <span className="flex-[1_1_120px] text-[13.5px] text-ink2">
                {v.image ? v.image.split("/").pop() : t.set.noShare}
                <br />
                <span className="text-[12.5px] text-ink3">{t.set.shareHint}</span>
              </span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setPicker(true)} className={`${btn.outline} min-h-10 px-3 text-[13.5px]`}>
                  <AIcon name="image" />
                  {t.content.chooseMedia}
                </button>
                <button type="button" onClick={() => input.current?.click()} aria-label={t.content.upload} className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink2">
                  <AIcon name="upload" />
                </button>
                {v.image && (
                  <button type="button" onClick={() => set({ image: null })} aria-label={t.c.del} className="grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink3 hover:text-red">
                    <AIcon name="x" />
                  </button>
                )}
              </div>
            </div>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const r = await uploadFile(f, "image");
                if ("src" in r) set({ image: r.src });
                else toast("err", t.toast.imgOnly);
              }}
            />
          </div>
        </section>
        <div className="flex flex-col gap-3.5">
          <div className="card flex flex-col gap-1 p-4">
            <span className="text-[12.5px] text-ink3">{t.set.gPreview}</span>
            <span className="text-[13px] text-green">{url}</span>
            <span className="text-lg leading-[1.35] text-blue">{gTitle}</span>
            <span className="line-clamp-2 text-sm leading-[1.55] text-ink2">{gDesc}</span>
          </div>
          <div className="card flex flex-col overflow-hidden">
            <span className="px-3.5 py-2.5 text-[12.5px] text-ink3">{t.set.socialPreview}</span>
            <span className="aspect-[1200/630]" style={{ background: imgBg }} />
            <span className="flex flex-col gap-[3px] bg-surface2 px-3.5 py-3">
              <span className="text-xs uppercase text-ink3">{url}</span>
              <strong className="text-[15px] leading-[1.4]">{gTitle}</strong>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink2">{gDesc}</span>
            </span>
          </div>
        </div>
      </div>
      <SaveRow
        dirty={dirty}
        pending={pending}
        onSave={() =>
          start(async () => {
            await saveSeo(target, v);
            setSaved((s) => ({ ...s, [target]: v }));
            toast("ok", t.toast.setSaved);
            router.refresh();
          })
        }
      />
      <MediaPicker open={picker} current={v.image} onPick={(image) => set({ image })} onClose={() => setPicker(false)} />
    </>
  );
}

function Languages({ list: initial }: { list: SiteLanguage[] }) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(initial);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  const commit = (next: SiteLanguage[], msg = t.toast.setSaved) => {
    setList(next);
    start(async () => {
      const r = await saveLanguages(next);
      if (!r.ok) return toast("err", t.toast.fix);
      toast("ok", msg);
      router.refresh();
    });
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toLowerCase();
    if (!/^[a-z]{2,3}$/.test(c)) return setErr(t.set.errCode);
    if (list.some((l) => l.code === c)) return setErr(t.set.errLangDup);
    if (!name.trim()) return setErr(t.set.errLangName);
    setErr(null);
    setCode("");
    setName("");
    commit([...list, { code: c, name: name.trim(), on: false }], t.toast.langAdded);
  };

  return (
    <section className="card max-w-[760px] overflow-hidden [animation:a-up_.4s_both]">
      <div className="flex flex-col gap-1 border-b border-line px-5 py-[18px]">
        <strong className="text-base">{t.set.langTitle}</strong>
        <span className="text-[13.5px] leading-normal text-ink2">{t.set.langSub}</span>
      </div>
      {list.map((l) => (
        <div key={l.code} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3 [animation:a-up_.3s_both]">
          <span className="grid h-8 w-11 place-items-center rounded-md bg-soft font-mono text-[13px] font-semibold text-blue">{l.code}</span>
          <strong className="flex-[1_1_120px] text-[15px]">
            {l.name}
            {!l.fixed && <span className="ml-2 text-xs font-normal text-ink3">{lang === "th" ? "(หน้าเว็บรองรับไทย/อังกฤษในเวอร์ชันนี้)" : "(the site supports Thai/English in this version)"}</span>}
          </strong>
          <button
            type="button"
            role="radio"
            aria-checked={!!l.def}
            onClick={() => !l.def && commit(list.map((x) => ({ ...x, def: x.code === l.code, on: x.code === l.code ? true : x.on })))}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 border-0 bg-transparent px-2.5 text-sm text-ink"
          >
            <span className={`grid size-5 place-items-center rounded-full border-2 ${l.def ? "border-blue-solid" : "border-ink3"}`}>
              <span className={`size-2.5 rounded-full bg-blue-solid transition-transform ${l.def ? "scale-100" : "scale-0"}`} />
            </span>
            {t.set.langDefault}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={l.on}
            aria-label={`${t.set.langOn} ${l.name}`}
            onClick={() => (l.def ? toast("err", t.toast.langDefOff) : commit(list.map((x) => (x.code === l.code ? { ...x, on: !x.on } : x))))}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 border-0 bg-transparent px-1.5 text-sm text-ink2"
          >
            <span className={`relative h-6 w-11 rounded-xl transition-colors ${l.on ? "bg-blue-solid" : "bg-line"}`}>
              <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform" style={{ transform: `translateX(${l.on ? 20 : 0}px)` }} />
            </span>
            {t.set.langOn}
          </button>
          {!l.fixed && (
            <button type="button" onClick={() => commit(list.filter((x) => x.code !== l.code))} aria-label={t.c.del} className={btn.iconDanger}>
              <AIcon name="trash" />
            </button>
          )}
        </div>
      ))}
      <form onSubmit={add} className="flex flex-wrap items-start gap-2 px-5 py-4">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="zh" aria-label={t.set.langCode} className="field min-h-11 w-[90px] font-mono" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="中文" aria-label={t.set.langName} className="field min-h-11 flex-[1_1_160px] w-auto" />
        <button type="submit" className={`${btn.primary} text-[14.5px]`}>
          <AIcon name="plus" />
          {t.set.addLang}
        </button>
        {err && (
          <span className="basis-full">
            <FieldError text={err} />
          </span>
        )}
      </form>
    </section>
  );
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

function Security() {
  const { t } = useAdmin();
  const toast = useToast();
  const [pw, setPw] = useState({ cur: "", nw: "", conf: "" });
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState<PwErrors>({});
  const [pending, start] = useTransition();

  const s = strength(pw.nw);
  const segTone = ["bg-red-solid", "bg-red-solid", "bg-amber", "bg-green-solid", "bg-green-solid"][s];
  const inkTone = ["text-red", "text-red", "text-amber", "text-green", "text-green"][s];
  const field = (k: keyof typeof pw, ac: string) => (
    <input
      type={show ? "text" : "password"}
      value={pw[k]}
      onChange={(e) => (setPw({ ...pw, [k]: e.target.value }), setErrs({ ...errs, [k]: undefined }))}
      autoComplete={ac}
      aria-invalid={!!errs[k]}
      className="field min-h-11"
    />
  );

  return (
    <div className="max-w-[620px] [animation:a-up_.4s_both]">
      <section className="card flex flex-col gap-4 px-[22px] pb-[22px] pt-5">
        <h2 className="m-0 flex items-center gap-2 text-[17px] font-semibold">
          <AIcon name="lock" />
          {t.set.pw}
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className={label}>{t.set.cur}</span>
          {field("cur", "current-password")}
          <FieldError text={errs.cur && t.set[errs.cur]} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>{t.set.nw}</span>
          <span className="relative block">
            {field("nw", "new-password")}
            <button type="button" onClick={() => setShow((x) => !x)} aria-label={show ? t.login.hidePw : t.login.showPw} className="absolute right-0.5 top-0 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-ink2">
              <AIcon name={show ? "eyeOff" : "eye"} />
            </button>
          </span>
          {pw.nw && (
            <span className="flex items-center gap-2.5">
              <span className="grid flex-1 grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-[5px] rounded-[3px] transition-colors ${i <= s ? segTone : "bg-line"}`} />
                ))}
              </span>
              <span className={`text-[12.5px] font-semibold ${inkTone}`}>{t.set.strength[s]}</span>
            </span>
          )}
          <FieldError text={errs.nw && t.set[errs.nw]} />
          <span className="text-[13px] text-ink3">{t.set.rule}</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>{t.set.conf}</span>
          {field("conf", "new-password")}
          <FieldError text={errs.conf && t.set[errs.conf]} />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await changePassword(pw.cur, pw.nw, pw.conf);
              if (!r.ok) return setErrs(r.errors ?? {});
              setPw({ cur: "", nw: "", conf: "" });
              setErrs({});
              toast("ok", t.toast.pwSaved);
            })
          }
          className={`${btn.primary} min-h-[46px] w-fit px-5`}
        >
          {t.set.updatePw}
        </button>
      </section>
    </div>
  );
}

function Backups({ backups, versions, users, auto: autoInit }: { backups: Backup[]; versions: VersionLite[]; users: Record<number, LText>; auto: boolean }) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [auto, setAuto] = useState(autoInit);
  const [confirm, setConfirm] = useState<{ kind: "backup"; id: string } | { kind: "file"; text: string } | { kind: "version"; v: number } | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const download = (id: string) => {
    const a = document.createElement("a");
    a.href = `/api/admin/backup/${id}`;
    a.click();
  };
  const doRestore = () =>
    start(async () => {
      if (!confirm) return;
      const r =
        confirm.kind === "version" ? await restoreVersion(confirm.v) : await restoreBackup(confirm.kind === "backup" ? { id: confirm.id } : { text: confirm.text });
      setConfirm(null);
      if (!r.ok) return toast("err", t.toast.badBackup);
      toast("ok", confirm.kind === "file" ? t.toast.restoredFile : confirm.kind === "version" ? t.toast.restored : t.toast.bkRestored);
      router.refresh();
    });

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4 [animation:a-up_.4s_both]">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-[18px]">
          <span className="flex flex-col gap-[3px]">
            <strong className="text-base">{t.set.bTitle}</strong>
            <span className="text-[13.5px] text-ink2">{t.set.bSub}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await backupNow();
                  toast("ok", t.toast.bkDone);
                  download(r.id);
                  router.refresh();
                })
              }
              className={`${btn.primary} text-[14.5px]`}
            >
              <AIcon name="download" />
              {t.set.bNow}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={`${btn.outline} text-[14.5px]`}>
              <AIcon name="upload" />
              {t.set.bRestore}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (f.size > 30 * 1024 * 1024) return toast("err", t.toast.badBackup);
                setConfirm({ kind: "file", text: await f.text() });
              }}
            />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={auto}
            onClick={() => {
              setAuto(!auto);
              start(async () => {
                await setAutoBackup(!auto);
                toast("ok", t.toast.setSaved);
              });
            }}
            className="flex cursor-pointer items-center gap-3.5 rounded-[10px] border border-line bg-surface2 px-3.5 py-3 text-left text-ink"
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <strong className="text-[14.5px] font-semibold">{t.set.bAutoTitle}</strong>
              <span className="text-[13px] text-ink2">{t.set.bAutoDesc}</span>
            </span>
            <span className={`relative h-6 w-11 flex-none rounded-xl transition-colors ${auto ? "bg-blue-solid" : "bg-line"}`}>
              <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform" style={{ transform: `translateX(${auto ? 20 : 0}px)` }} />
            </span>
          </button>
        </div>
        <div className="px-5 pb-1 pt-2.5 text-[13px] font-semibold text-ink2">{t.set.bList}</div>
        {backups.length === 0 && <div className="border-t border-line px-5 py-6 text-center text-sm text-ink3">{lang === "th" ? "ยังไม่มีไฟล์สำรอง" : "No backups yet"}</div>}
        {backups.map((b, i) => (
          <div key={b.id} style={{ animationDelay: `${i * 0.04}s` }} className="flex flex-wrap items-center gap-2.5 border-t border-line px-5 py-3 [animation:a-up_.35s_both]">
            <span className="flex flex-[1_1_180px] flex-col gap-0.5">
              <strong className="text-[14.5px] font-semibold">{fmtDate(b.when, lang)}</strong>
              <span className="text-[13px] text-ink2">
                {relDate(b.when, lang)} · {fmtSize(b.size)}
              </span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.auto ? "bg-soft text-blue" : "bg-surface2 text-ink2"}`}>{b.auto ? t.set.bAuto : t.set.bManual}</span>
            <button type="button" onClick={() => download(b.id)} aria-label={t.set.bDownload} title={t.set.bDownload} className={btn.icon}>
              <AIcon name="download" />
            </button>
            <button type="button" onClick={() => setConfirm({ kind: "backup", id: b.id })} className={`${btn.outline} min-h-[38px] px-3 text-[13.5px]`}>
              <AIcon name="undo" />
              {t.content.restore}
            </button>
          </div>
        ))}
      </section>
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-[3px] border-b border-line px-5 py-[18px]">
          <strong className="text-base">{t.content.vTitle}</strong>
          <span className="text-[13.5px] leading-normal text-ink2">{t.content.vSub}</span>
        </div>
        {versions.map((v, i) => (
          <div key={v.v} className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 first:border-t-0">
            <span className="w-10 font-mono text-[13px] font-semibold text-blue">v{v.v}</span>
            <span className="flex min-w-0 flex-[1_1_160px] flex-col gap-0.5">
              <strong className="text-[14.5px] font-semibold">{v.note[lang]}</strong>
              <span className="text-[13px] text-ink2">
                {users[v.userId]?.[lang] ?? "—"} · {relDate(v.when, lang)}
              </span>
            </span>
            {i === 0 ? (
              <span className="rounded-full bg-green-soft px-2.5 py-[3px] text-[12.5px] font-semibold text-green">{t.content.current}</span>
            ) : (
              <button type="button" onClick={() => setConfirm({ kind: "version", v: v.v })} className={`${btn.outline} min-h-[38px] px-3 text-[13.5px]`}>
                <AIcon name="undo" />
                {t.content.restore}
              </button>
            )}
          </div>
        ))}
      </section>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onOk={doRestore} title={t.cf.restoreTitle} text={t.cf.restoreText} okLabel={t.cf.restoreOk} danger={false} icon="undo" />
    </div>
  );
}
