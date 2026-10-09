/** ข้อความหน้าจอหลังบ้านภาษาไทยและอังกฤษ มาจากไฟล์ tt.generated.ts รวมกับส่วนเพิ่มด้านล่าง */
import type { LText, Locale } from "@/types/site";
import { TT } from "./tt.generated";

const L = (th: string, en: string): LText => ({ th, en });

/** ข้อความที่เพิ่มหรือแก้ทับจากข้อความในไฟล์ดีไซน์ */
const EXTRA = {
  nav: { design: L("ธีมและตัวอักษร", "Theme & type"), activity: L("ประวัติการแก้ไข", "Activity log"), viewSite: L("ดูหน้าเว็บไซต์", "View website") },
  top: { language: L("ภาษา", "Language") },
  login: {
    errCred: L("อีเมลหรือรหัสผ่านไม่ถูกต้อง", "Incorrect email or password"),
    showPw: L("แสดงรหัสผ่าน", "Show password"), hidePw: L("ซ่อนรหัสผ่าน", "Hide password"),
  },
  dash: {
    hello: L("สวัสดี คุณ", "Hello, "), latest: L("ล่าสุด", "Latest"),
    denied: L("บัญชีของคุณไม่มีสิทธิ์เข้าส่วนนั้น", "Your account doesn't have access to that area"),
    cMsgs: L("ข้อความที่ยังไม่ได้ตอบ", "Messages awaiting reply"),
    unread: L("ยังไม่อ่าน", "Unread"), readNoReply: L("อ่านแล้ว", "Read"),
  },
  roles: {
    super: L("ผู้ดูแลสูงสุด", "Super admin"), editor: L("แก้ไขเนื้อหา", "Content editor"),
    products: L("จัดการสินค้า", "Product manager"), viewer: L("ดูอย่างเดียว", "View only"),
  },
  set: { t_security: L("รหัสผ่าน", "Password") },
  dz: {
    radius: L("มุมโค้งการ์ดและกล่อง", "Card and box corners"),
    btnRadius: L("มุมโค้งปุ่ม", "Button corners"),
    imgRadius: L("มุมโค้งรูปภาพ", "Image corners"),
    inputRadius: L("มุมโค้งช่องค้นหาและช่องกรอก", "Search and input corners"),
    pill: L("แคปซูล", "Pill"),
  },
  pg: {
    label: L("เปลี่ยนหน้า", "Pages"),
    first: L("หน้าแรก", "First"), prev: L("ก่อนหน้า", "Previous"), next: L("ถัดไป", "Next"), last: L("หน้าสุดท้าย", "Last"),
    showing: L("แสดง {from} ถึง {to} จาก {total} รายการ", "Showing {from} to {to} of {total}"),
  },
  users: {
    added: L("เพิ่มผู้ดูแลแล้ว", "Admin added"), superOnly: L("เฉพาะผู้ดูแลสูงสุด", "Super admin only"), linkReady: L("สร้างลิงก์เชิญใหม่แล้ว", "New invite link created"),
    linkTitle: L("ลิงก์เชิญ", "Invite link"),
    linkText: L(
      "คัดลอกลิงก์นี้ไปส่งให้ผู้ใช้ เพื่อให้ตั้งรหัสผ่านและเริ่มใช้งาน ลิงก์ใช้ได้ 7 วัน",
      "Copy this link and send it to the user so they can set a password. It is valid for 7 days.",
    ),
  },
  inbox: { consent: L("ยินยอมให้เก็บข้อมูลเมื่อ", "Consented to data use on"), colMsg: L("ข้อความ", "Message") },
  soon: { title: L("กำลังพัฒนา", "Coming soon"), text: L("หน้านี้จะเปิดใช้ในขั้นตอนถัดไปของการพัฒนา", "This screen is part of the next development phase.") },
};

/** ตรวจว่าเป็นคู่ข้อความไทยกับอังกฤษจริง มีแค่ th และ en เท่านั้น ไม่ใช่กลุ่มที่บังเอิญมีสองคีย์นี้ */
function isLText(x: unknown): x is LText {
  if (!x || typeof x !== "object") return false;
  const k = Object.keys(x);
  return k.length === 2 && typeof (x as LText).th === "string" && typeof (x as LText).en === "string";
}

function merge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    const isText = isLText;
    out[k] = cur && typeof cur === "object" && v && typeof v === "object" && !isText(v) ? merge(cur as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
}

const DICT = merge(TT as unknown as Record<string, unknown>, EXTRA);

type Resolve<T> = T extends LText ? string : { [K in keyof T]: Resolve<T[K]> };
type DeepWiden<T> = T extends LText ? LText : { [K in keyof T]: DeepWiden<T[K]> };
export type AdminDict = Resolve<DeepWiden<typeof TT>> & Resolve<typeof EXTRA>;

function resolve(o: unknown, lang: Locale): unknown {
  if (Array.isArray(o)) return o.map((x) => resolve(x, lang));
  if (o && typeof o === "object") {
    if (isLText(o)) return o[lang];
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, resolve(v, lang)]));
  }
  return o;
}

const cache: Partial<Record<Locale, AdminDict>> = {};
export const getAdminDict = (lang: Locale): AdminDict => (cache[lang] ??= resolve(DICT, lang) as AdminDict);

export const ADMIN_LANG_COOKIE = "gd4_admin_lang";

const MTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** แปลงวันเวลาเป็นรูปแบบที่อ่านง่ายตามภาษา ภาษาไทยใช้ปี พ ศ */
export function fmtDate(d: string, lang: Locale, time = true): string {
  const [day, t] = d.split(" ");
  const [y, m, dd] = day.split("-").map(Number);
  return lang === "th"
    ? `${dd} ${MTH[m - 1]} ${y + 543}${time && t ? ` · ${t} น.` : ""}`
    : `${dd} ${MEN[m - 1]} ${y}${time && t ? `, ${t}` : ""}`;
}

/** บอกว่าผ่านมานานเท่าไรแล้วนับจากตอนนี้ ใช้เวลาประเทศไทย */
export function relDate(d: string, lang: Locale, now = Date.now()): string {
  const t = Date.parse(`${d.replace(" ", "T")}:00+07:00`);
  const min = Math.round((now - t) / 60000);
  if (min < 1) return lang === "th" ? "เมื่อสักครู่" : "just now";
  if (min < 60) return lang === "th" ? `${min} นาทีที่แล้ว` : `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return lang === "th" ? `${h} ชม.ที่แล้ว` : `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return lang === "th" ? `${days} วันที่แล้ว` : `${days} d ago`;
  return fmtDate(d, lang, false);
}

/** วันที่ของวันนี้ที่แสดงบนหน้าแดชบอร์ด ใช้เวลาประเทศไทย */
export function todayLine(lang: Locale, now = new Date()): string {
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH-u-ca-buddhist" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok",
  }).format(now);
}
