"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_LANG_COOKIE } from "@/admin/i18n";
import { verifyPassword } from "@/server/password";
import { SESSION_COOKIE, SESSION_DAYS_REMEMBER, SESSION_HOURS, createSessionToken } from "@/server/session";
import { mutate, nowStr, readDb } from "@/server/store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type LoginState = { errors?: { email?: "errEmail" | "errCred"; pw?: "errPw" }; email?: string } | undefined;

// กันการเดารหัสผ่าน ถ้าอีเมลเดียวกันใส่ผิด 5 ครั้งใน 15 นาที จะล็อกอีเมลนั้นไว้จนครบเวลา
// ตอนนี้เก็บไว้ในหน่วยความจำเท่านั้น เมื่อมีระบบหลังบ้านจริงควรย้ายไปเก็บในฐานข้อมูล
const fails = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60_000;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const pw = String(fd.get("pw") ?? "").slice(0, 200);
  const remember = fd.get("remember") === "on";

  const errors: NonNullable<LoginState>["errors"] = {};
  if (!EMAIL.test(email)) errors.email = "errEmail";
  if (pw.length < 6) errors.pw = "errPw";
  if (errors.email || errors.pw) return { errors, email };

  const f = fails.get(email);
  if (f && f.n >= 5 && f.until > Date.now()) return { errors: { email: "errCred" }, email };

  const user = readDb().users.find((u) => u.email.toLowerCase() === email);
  const ok = !!user && user.status === "active" && verifyPassword(pw, user.passwordHash);
  if (!ok || !user) {
    const cur = f && f.until > Date.now() ? f : { n: 0, until: Date.now() + WINDOW };
    fails.set(email, { n: cur.n + 1, until: cur.until });
    // แสดงข้อความเดียวกันทั้งกรณีไม่พบอีเมล รหัสผ่านผิด และบัญชีถูกระงับ
    return { errors: { email: "errCred" }, email };
  }
  fails.delete(email);

  const maxAge = remember ? SESSION_DAYS_REMEMBER * 86400 : SESSION_HOURS * 3600;
  (await cookies()).set(SESSION_COOKIE, createSessionToken(user.id, maxAge), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // ถ้าไม่เลือกจดจำฉัน คุกกี้จะหมดเมื่อปิดเบราว์เซอร์ และยังหมดอายุเองใน 12 ชั่วโมง
    ...(remember ? { maxAge } : {}),
  });
  mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastActive = nowStr();
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/** ตอนนี้ยังไม่ส่งอีเมลจริง และตอบเหมือนกันทุกครั้งเพื่อไม่ให้รู้ว่ามีอีเมลใดในระบบ */
export async function requestReset(fd: FormData): Promise<{ ok: boolean; email: string }> {
  const email = String(fd.get("email") ?? "").trim().slice(0, 160);
  if (!EMAIL.test(email)) return { ok: false, email };
  // งานที่ต้องทำเมื่อมีระบบหลังบ้าน สร้างรหัสรีเซ็ตแบบใช้ครั้งเดียวแล้วส่งลิงก์ทางอีเมล
  return { ok: true, email };
}

export async function setAdminLang(lang: "th" | "en") {
  (await cookies()).set(ADMIN_LANG_COOKIE, lang === "en" ? "en" : "th", { path: "/admin", maxAge: 365 * 86400, sameSite: "lax" });
}
