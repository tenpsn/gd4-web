"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan, getCurrentUser } from "@/server/auth";
import { parseBackup, readBackup, writeBackup } from "@/server/backup";
import { hashPassword, verifyPassword } from "@/server/password";
import { mutate, nowStr, readDb } from "@/server/store";
import type { Img, LText, SiteLanguage } from "@/types/site";

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const lt = (v: Partial<LText> | undefined, max: number): LText => ({ th: str(v?.th, max).trim(), en: str(v?.en, max).trim() });
const img = (s: unknown): Img => (typeof s === "string" && /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s) ? s : null);
const refresh = () => revalidatePath("/", "layout");

export async function saveGeneral(input: { siteName: LText; logo: Img; logoDark: Img; favicon: Img }) {
  await assertCan("settings", "edit");
  const siteName = lt(input.siteName, 80);
  if (!siteName.th || !siteName.en) return { ok: false as const, error: "errName" as const };
  mutate((db) => {
    Object.assign(db.settings, { siteName, logo: img(input.logo), logoDark: img(input.logoDark), favicon: img(input.favicon) });
  });
  refresh();
  return { ok: true as const };
}

/** บันทึก SEO ของทั้งเว็บหรือของหน้าใดหน้าหนึ่ง */
export async function saveSeo(target: string, input: { title: LText; description: LText; image: Img }) {
  await assertCan("settings", "edit");
  const seo = { title: lt(input.title, 120), description: lt(input.description, 320), image: img(input.image) };
  const ok = mutate((db) => {
    if (target === "site") {
      db.settings.seo = seo;
      return true;
    }
    const p = db.pages.find((x) => x.id === target);
    if (!p) return false;
    p.seo = seo;
    return true;
  });
  refresh();
  return { ok };
}

export async function saveLanguages(list: SiteLanguage[]) {
  await assertCan("settings", "edit");
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
  mutate((db) => {
    db.settings.languages = clean;
  });
  refresh();
  return { ok: true as const };
}

/* ความปลอดภัยของบัญชี ผู้ใช้ทุกคนจัดการบัญชีของตัวเองได้ */

export type PwErrors = Partial<Record<"cur" | "nw" | "conf", "errCur" | "errNw" | "errConf">>;

export async function changePassword(cur: string, nw: string, conf: string): Promise<{ ok: boolean; errors?: PwErrors }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Forbidden");
  const u = readDb().users.find((x) => x.id === me.id)!;
  const errors: PwErrors = {};
  if (!cur || !verifyPassword(cur, u.passwordHash)) errors.cur = "errCur";
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(nw)) errors.nw = "errNw";
  if (nw !== conf) errors.conf = "errConf";
  if (Object.keys(errors).length) return { ok: false, errors };
  mutate((db) => {
    db.users.find((x) => x.id === me.id)!.passwordHash = hashPassword(nw);
  });
  return { ok: true };
}

/* การสำรองข้อมูล */

export async function backupNow(): Promise<{ ok: true; id: string }> {
  const me = await assertCan("settings", "edit");
  const id = `b-${randomUUID().slice(0, 8)}`;
  const when = nowStr();
  const size = writeBackup(id, when);
  mutate((db) => {
    db.backups.unshift({ id, when, size, auto: false, userId: me.id });
    db.backups = db.backups.slice(0, 20);
    logActivity(db, me.id, "backup", { th: "สำรองด้วยตนเอง", en: "manual backup" });
  });
  return { ok: true, id };
}

export async function setAutoBackup(on: boolean) {
  await assertCan("settings", "edit");
  mutate((db) => {
    db.settings.autoBackup = !!on;
  });
  // ยังต้องทำ ตั้งให้สำรองอัตโนมัติทุกวันอาทิตย์ตอนตี 2 และเก็บไว้ 8 ชุด
  return { ok: true };
}

/** กู้คืนข้อมูลจากชุดสำรองที่เก็บไว้หรือไฟล์ที่อัปโหลด แล้วใช้บนเว็บจริงทันที */
export async function restoreBackup(source: { id: string } | { text: string }): Promise<{ ok: boolean }> {
  const me = await assertCan("settings", "edit");
  const b = "id" in source ? readBackup(String(source.id)) : parseBackup(String(source.text).slice(0, 30_000_000));
  if (!b) return { ok: false };
  mutate((db) => {
    const c = structuredClone(b.content);
    // สินค้า หมวดหมู่ และการตั้งค่าใช้ได้ทันที ส่วนหน้าเว็บและธีมกลับมาเป็นงานร่างให้ตรวจก่อนเผยแพร่
    const { menu, socials, footer, contact, ...rest } = c.settings;
    db.settings = { ...db.settings, ...rest };
    db.products = c.products;
    db.categories = c.categories;
    db.draft = { pages: c.pages, design: c.design ?? db.design, global: { menu, socials, footer, contact }, userId: me.id, when: nowStr() };
    db.draftRev++;
    logActivity(db, me.id, { th: "กู้คืนข้อมูลจากไฟล์สำรอง", en: "restored a backup from" }, { th: b.created, en: b.created });
  });
  refresh();
  return { ok: true };
}
