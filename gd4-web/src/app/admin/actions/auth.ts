"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_LANG_COOKIE } from "@/admin/i18n";
import { verifyPassword } from "@/server/password";
import { startSession } from "@/server/auth";
import { SESSION_COOKIE } from "@/server/session";
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

  const user = (await readDb()).users.find((u) => u.email.toLowerCase() === email);
  const ok = !!user && user.status === "active" && verifyPassword(pw, user.passwordHash);
  if (!ok || !user) {
    const cur = f && f.until > Date.now() ? f : { n: 0, until: Date.now() + WINDOW };
    fails.set(email, { n: cur.n + 1, until: cur.until });
    // แสดงข้อความเดียวกันทั้งกรณีไม่พบอีเมล รหัสผ่านผิด และบัญชีถูกระงับ
    return { errors: { email: "errCred" }, email };
  }
  fails.delete(email);

  await startSession(user.id, user.sessionVer ?? 0, remember);
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastActive = nowStr();
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function setAdminLang(lang: "th" | "en") {
  (await cookies()).set(ADMIN_LANG_COOKIE, lang === "en" ? "en" : "th", { path: "/admin", maxAge: 365 * 86400, sameSite: "lax" });
}
