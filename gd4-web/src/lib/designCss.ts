/**
 * แปลงการตั้งค่าธีมและตัวอักษรจากหลังบ้านเป็น CSS ที่ทับค่าเดิมใน globals.css
 * เขียนเฉพาะค่าที่ต่างจากค่าเริ่มต้น หน้าตาเดิมจึงไม่เปลี่ยนเลย
 */
import { DEFAULT_DESIGN } from "@/content/design";
import type { Design } from "@/types/site";

const PLEX = "IBM Plex Sans Thai";
const mix = (a: string, p: number, b: string) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const fontStack = (name: string) => (name === PLEX ? "var(--font-plex-thai), var(--font-plex), sans-serif" : `'${name.replace(/'/g, "")}', var(--font-plex-thai), sans-serif`);

export function designCss(d: Design): string {
  const D = DEFAULT_DESIGN;
  const out: string[] = [];
  const decl = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(";");

  /* ขนาดตัวอักษรตามขนาดหน้าจอ และระยะห่างของแต่ละส่วน */
  const bp = (k: "m" | "t" | "d") => {
    const v: Record<string, string> = {};
    for (const s of Object.keys(d.sizes) as (keyof Design["sizes"])[]) if (d.sizes[s][k] !== D.sizes[s][k]) v[`--fs-${s}`] = `${d.sizes[s][k]}px`;
    if (d.spacing !== 1) v["--sec-py"] = `${Math.round({ m: 52, t: 64, d: 88 }[k] * d.spacing)}px`;
    return v;
  };
  const root: Record<string, string> = bp("m");
  if (d.radius !== D.radius) Object.assign(root, { "--r": `${d.radius}px`, "--r-sm": `${Math.round((d.radius * 2) / 3)}px` });
  if ((d.btnRadius ?? D.btnRadius) !== D.btnRadius) root["--r-btn"] = `${d.btnRadius}px`;
  if ((d.imgRadius ?? D.imgRadius) !== D.imgRadius) root["--r-img"] = `${d.imgRadius}px`;
  if ((d.inputRadius ?? D.inputRadius) !== D.inputRadius) root["--r-input"] = `${d.inputRadius}px`;
  if (d.fonts.heading !== D.fonts.heading) root["--f-head"] = fontStack(d.fonts.heading);
  if (d.fonts.body !== D.fonts.body) root["--f-body"] = fontStack(d.fonts.body);

  /* สีโหมดสว่าง รวมถึงเฉดที่คำนวณจากสีหลัก */
  const L = d.colors.light, LD = D.colors.light;
  if (L.primary !== LD.primary) Object.assign(root, {
    "--c-primary": L.primary, "--c-primary-solid": L.primary, "--c-link": L.primary, "--c-primary-h": mix(L.primary, 80, "#000"),
    "--c-soft": mix(L.primary, 10, L.bg), "--c-panel": mix(L.primary, 72, "#000"), "--c-footer": mix(L.primary, 30, "#020814"),
  });
  if (L.accent !== LD.accent) Object.assign(root, { "--c-accent": L.accent, "--c-accent-solid": L.accent });
  if (L.bg !== LD.bg) Object.assign(root, { "--c-bg": L.bg, "--c-card": L.bg, "--c-line": mix(L.text, 12, L.bg) });
  if (L.bg2 !== LD.bg2) root["--c-bg2"] = L.bg2;
  if (L.text !== LD.text) root["--c-ink"] = L.text;
  if (L.muted !== LD.muted) Object.assign(root, { "--c-ink2": L.muted, "--c-ink3": mix(L.muted, 80, L.bg) });
  if (L.heading !== LD.heading) root["--c-heading"] = L.heading;
  if (Object.keys(root).length) out.push(`html:root{${decl(root)}}`);

  const t = bp("t"), dk = bp("d");
  if (Object.keys(t).length) out.push(`@media (min-width:640px){html:root{${decl(t)}}}`);
  if (Object.keys(dk).length) out.push(`@media (min-width:1024px){html:root{${decl(dk)}}}`);

  /* สีโหมดมืด */
  const K = d.colors.dark, KD = D.colors.dark, dark: Record<string, string> = {};
  if (K.primary !== KD.primary) Object.assign(dark, {
    "--c-primary-solid": K.primary, "--c-primary": mix(K.primary, 50, "#fff"), "--c-link": mix(K.primary, 50, "#fff"), "--c-primary-h": mix(K.primary, 85, "#fff"),
    "--c-soft": mix(K.primary, 25, K.bg), "--c-panel": mix(K.primary, 50, K.bg),
  });
  if (K.accent !== KD.accent) Object.assign(dark, { "--c-accent-solid": K.accent, "--c-accent": mix(K.accent, 60, "#fff") });
  if (K.bg !== KD.bg) Object.assign(dark, { "--c-bg": K.bg, "--c-card": mix(K.bg, 90, "#fff"), "--c-line": mix(K.text, 16, K.bg) });
  if (K.bg2 !== KD.bg2) dark["--c-bg2"] = K.bg2;
  if (K.text !== KD.text) dark["--c-ink"] = K.text;
  if (K.muted !== KD.muted) Object.assign(dark, { "--c-ink2": K.muted, "--c-ink3": mix(K.muted, 80, K.bg) });
  if (K.heading !== KD.heading) dark["--c-heading"] = K.heading;
  if (Object.keys(dark).length) out.push(`html[data-theme="dark"]{${decl(dark)}}`);

  /* ความหนา ความสูงบรรทัด และระยะห่างตัวอักษร วางไว้นอก layer เพื่อให้ชนะคลาสสำเร็จรูป */
  if (d.weight.heading !== D.weight.heading || d.lh.heading !== D.lh.heading || d.ls.heading !== D.ls.heading) {
    out.push(`html body :is(h1,h2,h3){font-weight:${d.weight.heading};line-height:${d.lh.heading};letter-spacing:${d.ls.heading / 100}em}`);
  }
  if (d.weight.body !== D.weight.body || d.lh.body !== D.lh.body || d.ls.body !== D.ls.body) {
    out.push(`html body{font-weight:${d.weight.body};line-height:${d.lh.body};letter-spacing:${d.ls.body / 100}em}`);
  }

  /* ไฟล์ฟอนต์ที่อัปโหลดไว้ */
  for (const f of d.customFonts) if (f.kind === "file" && f.src) out.push(`@font-face{font-family:'${f.name.replace(/'/g, "")}';src:url(${f.src});font-display:swap}`);
  return out.join("\n");
}

/** ลิงก์ Google Fonts สำหรับฟอนต์ที่ไม่ใช่ IBM Plex ที่มีในเว็บอยู่แล้ว ถ้าไม่มีจะได้ null */
export function googleFontsHref(d: Design): string | null {
  const files = new Set(d.customFonts.filter((f) => f.kind === "file").map((f) => f.name));
  const families = [...new Set([d.fonts.heading, d.fonts.body])].filter((n) => n !== PLEX && !files.has(n));
  if (!families.length) return null;
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700`).join("&")}&display=swap`;
}
