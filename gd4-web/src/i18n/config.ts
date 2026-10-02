import type { LText, Locale } from "@/types/site";

export const LOCALES: Locale[] = ["th", "en"];
export const DEFAULT_LOCALE: Locale = "th";

export const isLocale = (v: string | undefined): v is Locale => !!v && (LOCALES as string[]).includes(v);

/** เลือกข้อความตามภาษา ถ้าข้อความภาษาอังกฤษว่างจะใช้ภาษาไทยแทน */
export const tx = (t: LText | undefined, lang: Locale) => (t ? t[lang] || t.th : "");

/**
 * สร้างลิงก์ตามภาษา ภาษาไทยอยู่ที่หน้าหลัก ภาษาอังกฤษมี en นำหน้า
 * ลิงก์ภายนอก เบอร์โทร อีเมล และลิงก์ในหน้าเดียวกันจะไม่ถูกแก้
 */
export function href(path: string, lang: Locale): string {
  if (!path.startsWith("/")) return path;
  if (lang === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** ตัดรหัสภาษาที่อยู่หน้าลิงก์ออก */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(th|en)(?=\/|$)/);
  const rest = m ? pathname.slice(m[0].length) : pathname;
  return rest || "/";
}
