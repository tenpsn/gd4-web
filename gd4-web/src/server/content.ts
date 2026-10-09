import "server-only";
import { RESERVED_SLUGS, safeUrl, SLUG_RE, TYPES } from "@/admin/sectionSchema";
import { DEFAULT_DESIGN, FONT_CHOICES, SIZE_RANGE } from "@/content/design";
import { mapEmbedSrc } from "@/lib/mapEmbed";
import { alignMenu } from "@/lib/menu";
import type { ColorKey, CustomFont, Design, IconName, LText, MenuItem, Page, Section, SectionBg, SectionType, SiteSettings, SocialPlatform } from "@/types/site";
import type { DB, GlobalContent, Working } from "./types";

/** ฉบับที่หน้าแก้ไขใช้ทำงาน ถ้ามีฉบับร่างใช้ฉบับร่าง ถ้าไม่มีใช้ฉบับที่เผยแพร่อยู่ เมนูหลักปรับให้ตรงกับสวิตช์ของแต่ละหน้าเสมอ */
export function working(db: DB): Working {
  const w = db.draft ? { pages: db.draft.pages, design: db.draft.design, global: db.draft.global } : { pages: db.pages, design: db.design, global: globalOf(db.settings) };
  const { pages, menu } = alignMenu(w.pages, w.global.menu);
  return { ...w, pages, global: { ...w.global, menu } };
}

export const globalOf = (s: SiteSettings): GlobalContent => ({ menu: s.menu, socials: s.socials, footer: s.footer, contact: s.contact });

/* ทำความสะอาดข้อมูล ทุกอย่างที่ส่งมาจากเบราว์เซอร์ต้องผ่านตรงนี้ */

const str = (v: unknown, max = 2000) => String(v ?? "").slice(0, max);
const lt = (v: unknown, max = 2000): LText => {
  const o = (v && typeof v === "object" ? v : {}) as Partial<LText>;
  return { th: str(o.th, max), en: str(o.en, max) };
};
const img = (v: unknown) => (v === "placeholder" ? "placeholder" : typeof v === "string" && /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(v) ? v : null);
const id = (v: unknown, fallback: string) => (typeof v === "string" && /^[\w-]{1,64}$/.test(v) ? v : fallback);
const BGS: SectionBg[] = ["white", "gray", "blue", "navy"];
const ICONS: IconName[] = ["award", "users", "clock", "shield", "box", "chart", "heart", "phone", "check", "pin", "mail", "home"];
const PLATFORMS: SocialPlatform[] = ["facebook", "line", "youtube", "instagram", "linkedin", "tiktok", "x", "custom"];
const hex = (v: unknown, fb: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fb);
const num = (v: unknown, min: number, max: number, fb: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};

let seq = 0;
const fresh = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

function cleanFields(src: Record<string, unknown>, fields: (typeof TYPES)[SectionType]["fields"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = src[f.key];
    if (f.kind === "image") out[f.key] = img(v);
    else if (f.i18n) out[f.key] = lt(v, f.kind === "area" ? 4000 : 400);
    else if (f.url) out[f.key] = safeUrl(v);
    else if (f.key === "icon") out[f.key] = ICONS.includes(v as IconName) ? v : "check";
    else out[f.key] = str(v, 400);
  }
  return out;
}

export function cleanSection(raw: unknown): Section | null {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const type = s.type as SectionType;
  const def = TYPES[type];
  if (!def) return null;
  const out: Record<string, unknown> = {
    id: id(s.id, fresh("s")),
    type,
    hidden: !!s.hidden,
    bg: BGS.includes(s.bg as SectionBg) ? s.bg : def.defaultBg ?? "white",
    ...cleanFields(s, def.fields),
  };
  if (typeof s.anchor === "string" && /^[a-z0-9-]{1,40}$/.test(s.anchor)) out.anchor = s.anchor;
  if (def.item) {
    const items = Array.isArray(s.items) ? s.items.slice(0, 50) : [];
    out.items = items.map((it) => {
      const r = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      return { id: id(r.id, fresh("i")), hidden: !!r.hidden, ...cleanFields(r, def.item!.fields) };
    });
  }
  // ช่องที่ไม่ใช่ข้อความธรรมดา ต้องตรวจแยกตามประเภท
  if (type === "hero") out.autoplay = num(s.autoplay, 3, 20, 6);
  if (type === "cards") {
    const c = Number(s.cols);
    if ([2, 3, 4].includes(c)) out.cols = c;
    else delete out.cols;
  }
  if (type === "products") {
    out.count = num(s.count, 1, 24, 4);
    out.catalog = !!s.catalog;
    out.category = str(s.category, 40) || "all";
  }
  if (type === "textImage" && out.imgSide !== "left") out.imgSide = "right";
  return out as Section;
}

export function cleanPage(raw: unknown, existing?: Page): Page | null {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pid = existing?.id ?? id(p.id, "");
  if (!pid) return null;
  const sections = (Array.isArray(p.sections) ? p.sections : []).slice(0, 40).map(cleanSection).filter(Boolean) as Section[];
  return {
    id: pid,
    title: lt(p.title, 120),
    slug: existing?.system ? existing.slug : SLUG_RE.test(String(p.slug)) ? String(p.slug) : `/${pid}`,
    inMenu: !!p.inMenu,
    system: existing?.system ?? false,
    ...(existing?.seo ? { seo: existing.seo } : {}),
    sections,
  };
}

export function cleanGlobal(raw: unknown, fb: GlobalContent): GlobalContent {
  const g = (raw && typeof raw === "object" ? raw : {}) as Partial<GlobalContent>;
  const menu: MenuItem[] = (Array.isArray(g.menu) ? g.menu : fb.menu).slice(0, 12).map((m) => ({
    id: id(m?.id, fresh("m")),
    label: lt(m?.label, 80),
    url: safeUrl(m?.url) || "/",
    ...(Array.isArray(m?.children) && m.children.length
      ? { children: m.children.slice(0, 12).map((k) => ({ id: id(k?.id, fresh("mk")), label: lt(k?.label, 80), url: safeUrl(k?.url) || "/" })) }
      : {}),
  }));
  const socials = (Array.isArray(g.socials) ? g.socials : fb.socials).slice(0, 10).map((x) => {
    const platform = PLATFORMS.includes(x?.platform as SocialPlatform) ? (x!.platform as SocialPlatform) : "facebook";
    const base = { id: id(x?.id, fresh("so")), platform, url: /^https?:\/\//i.test(String(x?.url)) ? str(x?.url, 300) : "" };
    // ช่องทางอื่นเก็บชื่อและโลโก้ที่แอดมินใส่เองด้วย
    if (platform !== "custom") return base;
    const icon = img(x?.icon);
    return { ...base, name: str(x?.name, 40).trim(), icon: icon === "placeholder" ? null : icon };
  });
  const c = (g.contact ?? fb.contact) as Partial<GlobalContent["contact"]>;
  return {
    menu,
    socials,
    footer: { body: lt(g.footer?.body ?? fb.footer.body, 600), copyright: lt(g.footer?.copyright ?? fb.footer.copyright, 200) },
    contact: {
      address: lt(c.address, 400),
      phone: str(c.phone, 40),
      email: str(c.email, 160),
      hours: lt(c.hours, 200),
      mapEmbed: mapEmbedSrc(str(c.mapEmbed, 4000)),
    },
  };
}

const COLOR_KEYS: ColorKey[] = ["primary", "accent", "bg", "bg2", "heading", "text", "muted"];

export function cleanDesign(raw: unknown): Design {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<Design>;
  const D = DEFAULT_DESIGN;
  const customFonts: CustomFont[] = (Array.isArray(d.customFonts) ? d.customFonts : []).slice(0, 10).flatMap((f): CustomFont[] => {
    const name = str(f?.name, 60).trim().replace(/[^\p{L}\p{N} -]/gu, "");
    if (!name) return [];
    if (f?.kind === "file" && typeof f.src === "string" && /^\/media\/[0-9a-f-]{36}\.(woff2|woff|ttf|otf)$/.test(f.src)) return [{ name, kind: "file", src: f.src }];
    return f?.kind === "google" ? [{ name, kind: "google" }] : [];
  });
  const known = new Set([...FONT_CHOICES, ...customFonts.map((f) => f.name)]);
  const font = (v: unknown, fb: string) => (typeof v === "string" && known.has(v) ? v : fb);
  const sizes = Object.fromEntries(
    (Object.keys(D.sizes) as (keyof Design["sizes"])[]).map((k) => {
      const [min, max] = SIZE_RANGE[k];
      const s = d.sizes?.[k];
      return [k, { d: num(s?.d, min, max, D.sizes[k].d), t: num(s?.t, min, max, D.sizes[k].t), m: num(s?.m, min, max, D.sizes[k].m) }];
    }),
  ) as Design["sizes"];
  const colors = (m: "light" | "dark") => Object.fromEntries(COLOR_KEYS.map((k) => [k, hex(d.colors?.[m]?.[k], D.colors[m][k])])) as Record<ColorKey, string>;
  const w = (v: unknown, fb: number) => ([300, 400, 500, 600, 700, 800].includes(Number(v)) ? Number(v) : fb);
  return {
    fonts: { heading: font(d.fonts?.heading, D.fonts.heading), body: font(d.fonts?.body, D.fonts.body) },
    customFonts,
    sizes,
    weight: { heading: w(d.weight?.heading, D.weight.heading), body: w(d.weight?.body, D.weight.body) },
    lh: { heading: num(d.lh?.heading, 1, 2.2, D.lh.heading), body: num(d.lh?.body, 1, 2.2, D.lh.body) },
    ls: { heading: num(d.ls?.heading, -1, 4, D.ls.heading), body: num(d.ls?.body, -1, 4, D.ls.body) },
    colors: { light: colors("light"), dark: colors("dark") },
    radius: num(d.radius, 0, 28, D.radius),
    btnRadius: [0, 4, 8, 12, 999].includes(Number(d.btnRadius)) ? Number(d.btnRadius) : D.btnRadius,
    imgRadius: num(d.imgRadius, 0, 28, D.imgRadius),
    inputRadius: [0, 4, 8, 12, 999].includes(Number(d.inputRadius)) ? Number(d.inputRadius) : D.inputRadius,
    spacing: [0.75, 1, 1.3].includes(Number(d.spacing)) ? Number(d.spacing) : 1,
  };
}

/** ตรวจชื่อและที่อยู่ของหน้า ตอนเพิ่มหรือแก้ไขหน้า */
export function pageMetaErrors(pages: Page[], input: { id?: string; title: LText; slug: string }) {
  const e: Partial<Record<"th" | "en" | "slug", "errReq" | "errSlug" | "errSlugDup">> = {};
  if (!input.title.th.trim()) e.th = "errReq";
  if (!input.title.en.trim()) e.en = "errReq";
  const own = pages.find((p) => p.id === input.id);
  if (!own?.system) {
    if (!SLUG_RE.test(input.slug)) e.slug = "errSlug";
    else if (pages.some((p) => p.slug === input.slug && p.id !== input.id) || (RESERVED_SLUGS.includes(input.slug) && own?.slug !== input.slug)) e.slug = "errSlugDup";
  }
  return e;
}
