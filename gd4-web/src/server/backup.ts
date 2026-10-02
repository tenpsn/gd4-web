import "server-only";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readDb } from "./store";
import type { DB } from "./types";

/** ไฟล์สำรองเก็บแค่เนื้อหาและการตั้งค่าของเว็บ
 * ไม่เก็บข้อมูลผู้ใช้ รหัสผ่าน สิทธิ์ และข้อความติดต่อ */
const DIR = path.join(process.cwd(), ".data", "backups");

export type BackupContent = Pick<DB, "settings" | "pages" | "products" | "categories"> & Partial<Pick<DB, "design" | "versions">>;
export type BackupFile = { kind: "gd4-backup"; version: 1; created: string; content: BackupContent };

export function snapshot(): BackupContent {
  const db = readDb();
  return structuredClone({ settings: db.settings, pages: db.pages, products: db.products, categories: db.categories, design: db.design, versions: db.versions });
}

export function writeBackup(id: string, created: string): number {
  mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `${id}.json`);
  const body: BackupFile = { kind: "gd4-backup", version: 1, created, content: snapshot() };
  writeFileSync(file, JSON.stringify(body), "utf8");
  return statSync(file).size;
}

export function readBackup(id: string): BackupFile | null {
  if (!/^[a-z0-9-]{1,40}$/.test(id)) return null;
  const file = path.join(DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  return parseBackup(readFileSync(file, "utf8"));
}

/** ตรวจว่าไฟล์สำรองถูกต้องและเป็นของเว็บนี้ ถ้าไม่ใช่จะไม่คืนค่า */
export function parseBackup(text: string): BackupFile | null {
  try {
    const b = JSON.parse(text) as BackupFile;
    const c = b?.content;
    if (b?.kind !== "gd4-backup" || b.version !== 1 || !c) return null;
    if (!Array.isArray(c.pages) || !Array.isArray(c.products) || !Array.isArray(c.categories) || typeof c.settings !== "object") return null;
    return b;
  } catch {
    return null;
  }
}
