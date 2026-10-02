/**
 * คุกกี้การเข้าระบบที่มีลายเซ็นกันปลอม เก็บแค่รหัสผู้ใช้และเวลาหมดอายุ
 * ใช้ทั้งตอนตรวจเบื้องต้นใน proxy.ts และตอนตรวจเต็มรูปแบบฝั่งเซิร์ฟเวอร์
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gd4_admin";
export const SESSION_DAYS_REMEMBER = 30;
export const SESSION_HOURS = 12;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (32+ characters) in production");
  return "dev-only-insecure-secret-change-me-0000";
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export type SessionData = { uid: number; exp: number };

export function createSessionToken(uid: number, maxAgeSec: number): string {
  const body = b64(JSON.stringify({ uid, exp: Math.floor(Date.now() / 1000) + maxAgeSec } satisfies SessionData));
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
