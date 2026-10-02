/**
 * กำหนดว่าแต่ละประเภทส่วนมีช่องข้อมูลอะไรบ้าง
 * หน้าแก้ไขใช้เพื่อเลือกช่องที่จะแสดง และเซิร์ฟเวอร์ใช้เพื่อเลือกช่องที่จะเก็บ
 */
import type { IconName, LText, Section, SectionBg, SectionType } from "@/types/site";
import type { AIconName } from "./AIcon";

const L = (th: string, en: string): LText => ({ th, en });

export type FieldKind = "text" | "area" | "mono" | "image" | "chips" | "number";
export type Field = {
  key: string;
  kind: FieldKind;
  label: LText;
  /** เก็บข้อความทั้งภาษาไทยและอังกฤษ */
  i18n?: boolean;
  req?: boolean;
  /** ตัวเลือกของปุ่มเลือก ใส่ไว้ตายตัว หรือให้หน้าแก้ไขดึงรายการไอคอนหรือหมวดหมู่มาเอง */
  opts?: { v: string; label: LText }[] | "icons" | "cats";
  /** ให้ช่องนี้กว้างเต็มแถว */
  wide?: boolean;
  ph?: string;
  /** ช่องลิงก์ รับเฉพาะลิงก์ในเว็บ ลิงก์เว็บภายนอก เบอร์โทร และอีเมล */
  url?: boolean;
};

export type TypeDef = {
  group: "basic" | "special";
  icon: AIconName;
  name: LText;
  desc: LText;
  fields: Field[];
  item?: { name: LText; fields: Field[]; summary: string };
  /** ไม่มีตัวเลือกสีพื้นหลัง เพราะส่วนนี้ใช้พื้นสีกรมท่าเสมอ */
  noBg?: boolean;
  defaultBg?: SectionBg;
};

const F = {
  heading: { key: "heading", kind: "text", label: L("หัวข้อ", "Heading"), i18n: true, wide: true },
  sub: { key: "sub", kind: "area", label: L("ข้อความรอง", "Subheading"), i18n: true, wide: true },
  body: { key: "body", kind: "area", label: L("เนื้อหา", "Body text"), i18n: true, wide: true },
  btnLabel: { key: "btnLabel", kind: "text", label: L("ข้อความบนปุ่ม", "Button text"), i18n: true },
  btnUrl: { key: "btnUrl", kind: "mono", label: L("ลิงก์ปุ่ม", "Button link"), ph: "/contact", url: true },
  btn2Label: { key: "btn2Label", kind: "text", label: L("ปุ่มที่ 2 · ข้อความ", "Button 2 · text"), i18n: true },
  btn2Url: { key: "btn2Url", kind: "mono", label: L("ปุ่มที่ 2 · ลิงก์", "Button 2 · link"), ph: "tel:021234567", url: true },
  img: { key: "img", kind: "image", label: L("รูปภาพ", "Image") },
  imgAlt: { key: "imgAlt", kind: "text", label: L("คำอธิบายรูป (สำหรับผู้พิการทางสายตาและ SEO)", "Image description (accessibility & SEO)"), i18n: true },
  title: { key: "title", kind: "text", label: L("หัวข้อ", "Title"), i18n: true, req: true, wide: true },
  desc: { key: "desc", kind: "area", label: L("คำอธิบาย", "Description"), i18n: true, wide: true },
} satisfies Record<string, Field>;

const chips = (key: string, label: LText, values: (string | number)[], suffix?: LText): Field => ({
  key,
  kind: "chips",
  label,
  opts: values.map((v) => ({ v: String(v), label: suffix ? { th: `${v} ${suffix.th}`, en: `${v} ${suffix.en}` } : { th: String(v), en: String(v) } })),
});

export const TYPES: Record<SectionType, TypeDef> = {
  text: { group: "basic", icon: "text", name: L("ข้อความ", "Text"), desc: L("หัวข้อและย่อหน้า", "Heading and paragraphs"), fields: [F.heading, F.body] },
  textImage: {
    group: "basic", icon: "image", name: L("ข้อความ + รูป", "Text + image"), desc: L("ข้อความคู่รูปภาพ พร้อมปุ่ม", "Copy beside an image, with a button"),
    fields: [F.heading, F.body, F.img, F.imgAlt, { key: "imgSide", kind: "chips", label: L("ตำแหน่งรูป", "Image position"), opts: [{ v: "right", label: L("ขวา", "Right") }, { v: "left", label: L("ซ้าย", "Left") }] }, F.btnLabel, F.btnUrl],
  },
  cards: {
    group: "basic", icon: "grid", name: L("การ์ดหลายใบ", "Cards"), desc: L("จุดเด่น ค่านิยม ใบรับรอง", "Highlights, values, certificates"),
    fields: [F.heading, F.sub, { key: "cols", kind: "chips", label: L("จำนวนคอลัมน์", "Columns"), opts: [{ v: "", label: L("อัตโนมัติ", "Auto") }, ...["2", "3", "4"].map((v) => ({ v, label: L(v, v) }))] }],
    item: { name: L("การ์ด", "Card"), summary: "title", fields: [{ key: "icon", kind: "chips", label: L("ไอคอน", "Icon"), opts: "icons", wide: true }, F.title, F.desc] },
  },
  stats: {
    group: "basic", icon: "chart", name: L("ตัวเลข", "Figures"), desc: L("ตัวเลขความสำเร็จ", "Key figures"), defaultBg: "blue", fields: [F.heading],
    item: { name: L("ตัวเลข", "Figure"), summary: "value", fields: [{ key: "value", kind: "text", label: L("ตัวเลข", "Figure"), i18n: true, req: true }, { key: "label", kind: "text", label: L("คำอธิบายตัวเลข", "Label"), i18n: true }] },
  },
  gallery: {
    group: "basic", icon: "image", name: L("แกลเลอรี", "Gallery"), desc: L("รูปภาพหลายรูปพร้อมคำบรรยาย", "Images with captions"), fields: [F.heading],
    item: { name: L("รูป", "Image"), summary: "caption", fields: [{ ...F.img, wide: true }, { key: "caption", kind: "text", label: L("คำบรรยายภาพ", "Caption"), i18n: true, wide: true }] },
  },
  video: {
    group: "basic", icon: "monitor", name: L("วิดีโอ", "Video"), desc: L("ฝังวิดีโอ YouTube หรือ Vimeo", "Embed a YouTube or Vimeo video"),
    fields: [F.heading, F.body, { key: "videoUrl", kind: "mono", label: L("ลิงก์วิดีโอ (YouTube / Vimeo)", "Video link (YouTube / Vimeo)"), ph: "https://youtube.com/watch?v=…", wide: true, url: true }, { key: "cover", kind: "image", label: L("ภาพหน้าปกวิดีโอ", "Video cover") }],
  },
  table: {
    group: "basic", icon: "list", name: L("ตาราง", "Table"), desc: L("ตารางสองคอลัมน์", "Two-column table"), defaultBg: "gray",
    fields: [F.heading, { key: "h1", kind: "text", label: L("หัวคอลัมน์ซ้าย", "Left column header"), i18n: true }, { key: "h2", kind: "text", label: L("หัวคอลัมน์ขวา", "Right column header"), i18n: true }],
    item: { name: L("แถว", "Row"), summary: "c1", fields: [{ key: "c1", kind: "text", label: L("คอลัมน์ซ้าย", "Left column"), i18n: true, req: true }, { key: "c2", kind: "text", label: L("คอลัมน์ขวา", "Right column"), i18n: true }] },
  },
  cta: {
    group: "basic", icon: "external", name: L("แบนเนอร์ CTA", "CTA banner"), desc: L("ข้อความชวนติดต่อพร้อมปุ่ม", "Call to action with buttons"), defaultBg: "navy",
    fields: [F.heading, F.sub, F.btnLabel, F.btnUrl, F.btn2Label, F.btn2Url],
  },
  faq: {
    group: "basic", icon: "alert", name: L("คำถามที่พบบ่อย", "FAQ"), desc: L("คำถาม-คำตอบแบบพับเก็บได้", "Collapsible questions and answers"), fields: [F.heading],
    item: { name: L("คำถาม", "Question"), summary: "q", fields: [{ key: "q", kind: "text", label: L("คำถาม", "Question"), i18n: true, req: true, wide: true }, { key: "a", kind: "area", label: L("คำตอบ", "Answer"), i18n: true, wide: true }] },
  },
  pageHeader: { group: "basic", icon: "page", name: L("ส่วนหัวของหน้า", "Page header"), desc: L("หัวข้อหน้า เส้นทาง และคำโปรย", "Page title, breadcrumb and intro"), noBg: true, defaultBg: "navy", fields: [{ ...F.heading, req: true }, F.sub] },
  hero: {
    group: "special", icon: "image", name: L("สไลด์ Hero", "Hero slides"), desc: L("ภาพสไลด์ด้านบนสุดของหน้า", "Rotating banner at the top of the page"), noBg: true, defaultBg: "navy",
    fields: [chips("autoplay", L("เปลี่ยนสไลด์ทุก", "Slide interval"), [4, 5, 6, 8], L("วินาที", "s"))],
    item: { name: L("สไลด์", "Slide"), summary: "title", fields: [F.title, { key: "sub", kind: "area", label: L("ข้อความรอง", "Subheading"), i18n: true, wide: true }, F.img, F.imgAlt, F.btnLabel, F.btnUrl] },
  },
  timeline: {
    group: "special", icon: "clock", name: L("ไทม์ไลน์", "Timeline"), desc: L("เหตุการณ์สำคัญตามปี", "Milestones by year"), defaultBg: "gray", fields: [F.heading],
    item: { name: L("เหตุการณ์", "Milestone"), summary: "year", fields: [{ key: "year", kind: "mono", label: L("ปี", "Year"), req: true }, { key: "event", kind: "text", label: L("เหตุการณ์", "Milestone"), i18n: true, req: true }] },
  },
  steps: {
    group: "special", icon: "list", name: L("ขั้นตอนบริการ", "Service steps"), desc: L("ขั้นตอนเรียงลำดับ", "Numbered steps"), defaultBg: "gray", fields: [F.heading],
    item: { name: L("ขั้นตอน", "Step"), summary: "title", fields: [F.title, F.desc] },
  },
  logos: {
    group: "special", icon: "copy", name: L("โลโก้พันธมิตร", "Partner logos"), desc: L("แถบโลโก้ เลื่อนอัตโนมัติเมื่อมี 6 โลโก้ขึ้นไป", "Logo strip, scrolls with 6 or more"), defaultBg: "gray", fields: [F.heading],
    item: { name: L("โลโก้", "Logo"), summary: "name", fields: [{ key: "name", kind: "text", label: L("ชื่อพันธมิตร", "Partner name"), req: true }, { key: "logo", kind: "image", label: L("ไฟล์โลโก้", "Logo file") }] },
  },
  products: {
    group: "special", icon: "box", name: L("รายการสินค้า", "Product grid"), desc: L("ดึงจากระบบจัดการสินค้าอัตโนมัติ", "Pulled from the product catalog"),
    fields: [F.heading, F.sub, { key: "category", kind: "chips", label: L("หมวดหมู่ที่แสดง", "Category shown"), opts: "cats", wide: true }, chips("count", L("จำนวนสินค้าที่แสดง", "Products shown"), [4, 8, 12])],
  },
  contact: {
    group: "special", icon: "phone", name: L("ข้อมูลติดต่อและแผนที่", "Contact details & map"), desc: L("ที่อยู่ เบอร์โทร อีเมล พิกัด และฟอร์ม", "Address, phone, email, map and form"),
    fields: [{ ...F.heading, label: L("หัวข้อฟอร์ม", "Form heading") }],
  },
};

/** ข้อมูลติดต่อที่แก้ได้ในส่วนติดต่อเรา เก็บไว้ใช้ทั้งเว็บรวมถึงท้ายเว็บ */
export const CONTACT_FIELDS: Field[] = [
  { key: "address", kind: "area", label: L("ที่อยู่", "Address"), i18n: true, wide: true },
  { key: "phone", kind: "mono", label: L("เบอร์โทรศัพท์", "Phone"), req: true },
  { key: "email", kind: "mono", label: L("อีเมล", "Email"), req: true },
  { key: "hours", kind: "text", label: L("เวลาทำการ", "Business hours"), i18n: true, wide: true },
  { key: "lat", kind: "number", label: L("ละติจูด", "Latitude") },
  { key: "lng", kind: "number", label: L("ลองจิจูด", "Longitude") },
];

export const ICON_CHOICES: IconName[] = ["award", "shield", "clock", "users", "check", "heart", "box", "chart", "phone", "pin"];

/** สร้างส่วนใหม่ตามประเภทที่เลือก พร้อมค่าว่างเริ่มต้น */
export function newSection(type: SectionType, id: string): Section {
  const def = TYPES[type];
  const base: Record<string, unknown> = { id, type, bg: def.defaultBg ?? "white" };
  for (const f of def.fields) base[f.key] = f.i18n ? { th: "", en: "" } : f.kind === "chips" && Array.isArray(f.opts) ? f.opts[0]?.v ?? "" : f.kind === "image" ? null : "";
  if (type === "hero") base.autoplay = 6;
  if (type === "products") Object.assign(base, { category: "all", count: 4 });
  if (type === "textImage") base.imgSide = "right";
  if (type === "cards") delete base.cols;
  if (def.item) base.items = [newItem(type, `${id}-i1`)];
  return base as Section;
}

export function newItem(type: SectionType, id: string): Record<string, unknown> {
  const it: Record<string, unknown> = { id };
  for (const f of TYPES[type].item?.fields ?? []) it[f.key] = f.i18n ? { th: "", en: "" } : f.kind === "image" ? (type === "logos" ? null : "placeholder") : f.key === "icon" ? "check" : "";
  return it;
}

/** ตรวจลิงก์ให้ปลอดภัย ถ้าไม่ใช่ลิงก์ในเว็บ เว็บภายนอก เบอร์โทร หรืออีเมล จะกลายเป็นค่าว่าง */
export function safeUrl(v: unknown): string {
  const s = String(v ?? "").trim().slice(0, 500);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (/^(#|https?:\/\/|tel:|mailto:)/i.test(s)) return s;
  return "";
}

export const SLUG_RE = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
/** ที่อยู่ที่ระบบใช้อยู่แล้ว หน้าใหม่ห้ามใช้ซ้ำ */
export const RESERVED_SLUGS = ["/", "/about", "/products", "/service", "/contact", "/en", "/th", "/admin", "/api", "/media", "/preview"];
