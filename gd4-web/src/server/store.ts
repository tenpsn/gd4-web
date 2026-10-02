import "server-only";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createSeed } from "./seed";
import type { DB } from "./types";

/** ฐานข้อมูลจำลองเก็บเป็นไฟล์ JSON ไฟล์เดียวและจำไว้ในหน่วยความจำ
 * ทุกการอ่านเขียนผ่าน readDb และ mutate เมื่อย้ายไป PostgreSQL จึงเปลี่ยนแค่ไฟล์นี้ */
const FILE = path.join(process.cwd(), ".data", "mock-db.json");

// เก็บข้อมูลไว้ไม่ให้หายเมื่อโค้ดโหลดใหม่ระหว่างพัฒนา
const g = globalThis as unknown as { __gd4db?: DB; __gd4rev?: number };

/** เพิ่มเลขนี้ทุกครั้งที่ migrate รู้จักข้อมูลใหม่ เพื่อให้ข้อมูลในหน่วยความจำถูกปรับตาม */
const MIGRATE_REV = 5;

function load(): DB {
  if (existsSync(FILE)) {
    try {
      const db = JSON.parse(readFileSync(FILE, "utf8")) as DB;
      if (db.version === 1) return migrate(db);
    } catch {
      console.warn("[store] mock-db.json is unreadable, re-seeding");
    }
  }
  const db = createSeed();
  save(db);
  return db;
}

/** เติมข้อมูลที่เพิ่มมาทีหลังให้ไฟล์เก่ายังใช้งานได้ ช่วงที่ใช้ PostgreSQL จะแทนด้วยการปรับฐานข้อมูลจริง */
function migrate(db: DB): DB {
  const seed = createSeed();
  const st = db.settings as Partial<DB["settings"]> & { name?: string };
  db.settings = { ...seed.settings, ...st, siteName: st.siteName ?? { th: st.name ?? "GD4 Medical", en: st.name ?? "GD4 Medical" } } as DB["settings"];
  delete (db.settings as { name?: string }).name;
  db.backups = (db.backups ?? []).filter((b) => !/^b[0-9]$/.test(b.id)); // ตัดรายการตัวอย่างที่ไม่มีไฟล์จริงออก
  db.media ??= [];
  db.design ??= seed.design;
  db.versions ??= seed.versions;
  for (const v of db.versions) v.global ??= structuredClone({ menu: db.settings.menu, socials: db.settings.socials, footer: db.settings.footer, contact: db.settings.contact });
  db.draft ??= null;
  db.draftRev ??= 0;
  if (db.draft && !db.draft.global) db.draft = null;
  for (const p of db.pages) {
    const sp = seed.pages.find((x) => x.id === p.id);
    p.inMenu ??= sp?.inMenu ?? false;
    p.system ??= sp?.system ?? false;
  }
  return db;
}

function save(db: DB) {
  mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  renameSync(tmp, FILE);
}

export function readDb(): DB {
  g.__gd4db ??= load();
  if (g.__gd4rev !== MIGRATE_REV) {
    migrate(g.__gd4db);
    g.__gd4rev = MIGRATE_REV;
  }
  return g.__gd4db;
}

/** แก้ข้อมูลแล้วบันทึกลงไฟล์ทันที เขียนทีละครั้งจึงไม่ทับกัน */
export function mutate<T>(fn: (db: DB) => T): T {
  const db = readDb();
  const result = fn(db);
  save(db);
  return result;
}

/** วันที่และเวลาปัจจุบันตามเวลาประเทศไทย ในรูปแบบเดียวกับข้อมูลจำลอง */
export function nowStr(): string {
  const d = new Date(Date.now() + 7 * 3600_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export const nextId = (list: { id: number }[]) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
