import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** เข้ารหัสรหัสผ่านด้วย scrypt แล้วเก็บค่าสุ่มคู่กับผลลัพธ์ไว้ด้วยกัน */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(pw, Buffer.from(salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
