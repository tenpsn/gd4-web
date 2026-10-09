"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan, getCurrentUser, renewSession } from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/password";
import { mutate, readDb } from "@/server/store";
import type { Img, LText, SiteLanguage } from "@/types/site";

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const lt = (v: Partial<LText> | undefined, max: number): LText => ({ th: str(v?.th, max).trim(), en: str(v?.en, max).trim() });
const img = (s: unknown): Img => (typeof s === "string" && /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s) ? s : null);
const refresh = () => revalidatePath("/", "layout");
const SET = { th: "แก้ตั้งค่า", en: "updated settings" };

export async function saveGeneral(input: { siteName: LText; logo: Img; logoDark: Img; favicon: Img }) {
  const me = await assertCan("settings", "edit");
  const siteName = lt(input.siteName, 80);
  if (!siteName.th || !siteName.en) return { ok: false as const, error: "errName" as const };
  await mutate((db) => {
    Object.assign(db.settings, { siteName, logo: img(input.logo), logoDark: img(input.logoDark), favicon: img(input.favicon) });
    logActivity(db, me.id, SET, { th: "ทั่วไป", en: "general" });
  });
  refresh();
  return { ok: true as const };
}

/** บันทึก SEO ของทั้งเว็บหรือของหน้าใดหน้าหนึ่ง */
export async function saveSeo(target: string, input: { title: LText; description: LText; image: Img }) {
  const me = await assertCan("settings", "edit");
  const seo = { title: lt(input.title, 120), description: lt(input.description, 320), image: img(input.image) };
  const ok = await mutate((db) => {
    if (target === "site") {
      db.settings.seo = seo;
      logActivity(db, me.id, SET, { th: "SEO ทั้งเว็บ", en: "site SEO" });
      return true;
    }
    const p = db.pages.find((x) => x.id === target);
    if (!p) return false;
    p.seo = seo;
    logActivity(db, me.id, SET, { th: `SEO หน้า ${p.title.th}`, en: `SEO of ${p.title.en}` });
    return true;
  });
  refresh();
  return { ok };
}

export async function saveLanguages(list: SiteLanguage[]) {
  const me = await assertCan("settings", "edit");
  const clean = (Array.isArray(list) ? list : []).slice(0, 12).map((l) => ({
    code: str(l.code, 3).toLowerCase(),
    name: str(l.name, 40).trim(),
    on: !!l.on,
    def: !!l.def,
    fixed: l.code === "th" || l.code === "en",
  }));
  if (clean.some((l) => !/^[a-z]{2,3}$/.test(l.code) || !l.name)) return { ok: false as const };
  // ต้องมีภาษาหลักเพียงภาษาเดียว และต้องเปิดใช้งานอยู่
  const def = clean.find((l) => l.def && l.on) ?? clean.find((l) => l.code === "th")!;
  clean.forEach((l) => (l.def = l === def));
  def.on = true;
  await mutate((db) => {
    db.settings.languages = clean;
    logActivity(db, me.id, SET, { th: "ภาษา", en: "languages" });
  });
  refresh();
  return { ok: true as const };
}

/* ความปลอดภัยของบัญชี ผู้ใช้ทุกคนจัดการบัญชีของตัวเองได้ */

export type PwErrors = Partial<Record<"cur" | "nw" | "conf", "errCur" | "errNw" | "errConf">>;

export async function changePassword(cur: string, nw: string, conf: string): Promise<{ ok: boolean; errors?: PwErrors }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Forbidden");
  const u = (await readDb()).users.find((x) => x.id === me.id)!;
  const errors: PwErrors = {};
  if (!cur || !verifyPassword(cur, u.passwordHash)) errors.cur = "errCur";
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(nw)) errors.nw = "errNw";
  if (nw !== conf) errors.conf = "errConf";
  if (Object.keys(errors).length) return { ok: false, errors };
  const ver = await mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    u.passwordHash = hashPassword(nw);
    // เครื่องอื่นที่เข้าระบบอยู่จะหลุดออก ส่วนเครื่องนี้ได้คุกกี้ใหม่ด้านล่าง
    u.sessionVer = (u.sessionVer ?? 0) + 1;
    logActivity(db, me.id, { th: "เปลี่ยนรหัสผ่าน", en: "changed password" }, { th: "บัญชีตัวเอง", en: "own account" });
    return u.sessionVer;
  });
  await renewSession(me.id, ver);
  return { ok: true };
}
