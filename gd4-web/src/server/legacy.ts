import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { PoolClient } from "pg";
import { MIME, UPLOAD_NAME } from "./files";
import type { DB } from "./types";

/** ย้ายข้อมูลจำลองเดิมและรูปในโฟลเดอร์ .data เข้าฐานข้อมูล ใช้ครั้งเดียวตอนฐานข้อมูลยังว่าง
 * ถ้าไม่มีไฟล์ mock-db.json จะคืนค่า null เพื่อให้ใช้ข้อมูลตั้งต้นแทน */
const DIR = path.join(process.cwd(), ".data");

export async function importLegacy(c: PoolClient): Promise<DB | null> {
  const uploads = path.join(DIR, "uploads");
  if (existsSync(uploads)) {
    for (const name of readdirSync(uploads).filter((n) => UPLOAD_NAME.test(n))) {
      const body = readFileSync(path.join(uploads, name));
      await c.query("insert into uploads (name, type, size, body) values ($1, $2, $3, $4) on conflict (name) do nothing", [
        name,
        MIME[name.split(".").pop()!],
        body.length,
        body,
      ]);
    }
  }

  const file = path.join(DIR, "mock-db.json");
  if (!existsSync(file)) return null;
  try {
    const db = JSON.parse(readFileSync(file, "utf8")) as DB;
    return db.version === 1 ? db : null;
  } catch {
    console.warn("[store] mock-db.json is unreadable, using seed data");
    return null;
  }
}
