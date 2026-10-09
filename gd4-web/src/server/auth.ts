import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_DAYS_REMEMBER, SESSION_HOURS, createSessionToken, readSessionToken } from "./session";
import { readDb } from "./store";
import { superOnly, type Action, type AdminUser, type Area, type Perms, type PublicUser } from "./types";

/** ผู้ใช้ที่เข้าระบบอยู่ พร้อมสิทธิ์ของบทบาทตัวเองที่อ่านมาพร้อมกัน */
export type CurrentUser = PublicUser & { access: Perms[keyof Perms] };

export function toPublic(user: AdminUser): PublicUser {
  const u: Partial<AdminUser> = { ...user };
  delete u.passwordHash;
  delete u.inviteHash;
  delete u.inviteExpires;
  delete u.sessionVer;
  return u as PublicUser;
}

/** หาผู้ใช้ที่เข้าสู่ระบบอยู่และบัญชียังใช้งานได้ ถ้าไม่มีจะได้ null ตรวจใหม่ทุกครั้งที่มีคำขอ */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const db = await readDb();
  const user = db.users.find((u) => u.id === session.uid);
  if (!user || user.status !== "active") return null;
  // เปลี่ยนรหัสผ่านแล้ว คุกกี้ของเครื่องอื่นที่ยังเป็นรุ่นเก่าจะใช้ไม่ได้
  if ((session.v ?? 0) !== (user.sessionVer ?? 0)) return null;
  return { ...toPublic(user), access: structuredClone(db.perms[user.role]) };
});

/** ตั้งคุกกี้การเข้าระบบ ถ้าส่ง expSec มาจะใช้เวลาหมดอายุเดิม ใช้ตอนออกคุกกี้ใหม่ให้เครื่องที่เพิ่งเปลี่ยนรหัสผ่าน */
export async function startSession(uid: number, sessionVer: number, remember: boolean, expSec?: number) {
  const now = Math.floor(Date.now() / 1000);
  const exp = expSec ?? now + (remember ? SESSION_DAYS_REMEMBER * 86400 : SESSION_HOURS * 3600);
  (await cookies()).set(SESSION_COOKIE, createSessionToken(uid, exp, sessionVer, remember), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // ถ้าไม่เลือกจดจำการเข้าสู่ระบบ คุกกี้จะหมดเมื่อปิดเบราว์เซอร์ และยังหมดอายุเองใน 12 ชั่วโมง
    ...(remember ? { maxAge: Math.max(0, exp - now) } : {}),
  });
}

/** ออกคุกกี้ใหม่ให้เครื่องที่ใช้อยู่ หลังเพิ่มรุ่นการเข้าระบบ เครื่องนี้จึงไม่หลุดตามเครื่องอื่น */
export async function renewSession(uid: number, sessionVer: number) {
  const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (session?.uid !== uid) return;
  await startSession(uid, sessionVer, !!session.r, session.exp);
}

export function can(user: Pick<CurrentUser, "role" | "access"> | null, area: Area, action: Action = "view"): boolean {
  if (!user) return false;
  if (user.role === "super") return true;
  if (superOnly(area, action)) return false;
  return !!user.access?.[area]?.[action];
}

/** เรียกใช้ตอนต้นของทุกหน้าแอดมิน ถ้าไม่มีสิทธิ์จะพาไปหน้าอื่น */
export async function requireUser(area?: Area, action: Action = "view"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (area && !can(user, area, action)) redirect("/admin?denied=1");
  return user;
}

/** ใช้ตอนบันทึกข้อมูล ถ้าไม่มีสิทธิ์จะแจ้งข้อผิดพลาดแทนการพาไปหน้าอื่นกลางคัน */
export async function assertCan(area: Area, action: Action): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !can(user, area, action)) throw new Error("Forbidden");
  return user;
}
