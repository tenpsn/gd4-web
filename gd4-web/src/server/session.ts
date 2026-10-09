/**
 * คุกกี้การเข้าระบบที่มีลายเซ็นกันปลอม เก็บรหัสผู้ใช้ เวลาหมดอายุ และรุ่นการเข้าระบบ
 * ใช้ทั้งตอนตรวจเบื้องต้นใน proxy.ts และตอนตรวจเต็มรูปแบบฝั่งเซิร์ฟเวอร์
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gd4_admin";
export const SESSION_DAYS_REMEMBER = 30;
export const SESSION_HOURS = 12;

export function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (32+ characters) in production");
  return "dev-only-insecure-secret-change-me-0000";
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

/** v คือรุ่นการเข้าระบบของผู้ใช้ ถ้าไม่ตรงกับในฐานข้อมูลถือว่าหลุดจากระบบ และ r บอกว่าเลือกจดจำการเข้าสู่ระบบไว้ */
export type SessionData = { uid: number; exp: number; v?: number; r?: boolean };

export function createSessionToken(uid: number, expSec: number, v: number, remember: boolean): string {
  const body = b64(JSON.stringify({ uid, exp: expSec, v, r: remember } satisfies SessionData));
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token: string | undefined): SessionData | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionData;
    if (typeof data.uid !== "number" || data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
