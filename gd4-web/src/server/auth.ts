import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, readSessionToken } from "./session";
import { readDb } from "./store";
import type { Action, AdminUser, Area, PublicUser } from "./types";

export function toPublic(user: AdminUser): PublicUser {
  const u: Partial<AdminUser> = { ...user };
  delete u.passwordHash;
  delete u.inviteHash;
  delete u.inviteExpires;
  return u as PublicUser;
}

/** หาผู้ใช้ที่เข้าสู่ระบบอยู่และบัญชียังใช้งานได้ ถ้าไม่มีจะได้ null ตรวจใหม่ทุกครั้งที่มีคำขอ */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = readDb().users.find((u) => u.id === session.uid);
  if (!user || user.status !== "active") return null;
  return toPublic(user);
});

export function can(user: Pick<PublicUser, "role"> | null, area: Area, action: Action = "view"): boolean {
  if (!user) return false;
  if (user.role === "super") return true;
  return !!readDb().perms[user.role]?.[area]?.[action];
}

/** เรียกใช้ตอนต้นของทุกหน้าแอดมิน ถ้าไม่มีสิทธิ์จะพาไปหน้าอื่น */
export async function requireUser(area?: Area, action: Action = "view"): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (area && !can(user, area, action)) redirect("/admin?denied=1");
  return user;
}

/** ใช้ตอนบันทึกข้อมูล ถ้าไม่มีสิทธิ์จะแจ้งข้อผิดพลาดแทนการพาไปหน้าอื่นกลางคัน */
export async function assertCan(area: Area, action: Action): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user || !can(user, area, action)) throw new Error("Forbidden");
  return user;
}
