import "server-only";
import { Pool, type PoolClient } from "pg";

/** ตารางที่เก็บรายการเป็นชุด แต่ละแถวเก็บข้อมูลหนึ่งรายการและลำดับในรายการ */
export const LIST_TABLES = ["users", "pages", "categories", "products", "messages", "activity", "media"] as const;
export type ListTable = (typeof LIST_TABLES)[number];

const SCHEMA = `
create table if not exists meta (key text primary key, value jsonb not null);
${LIST_TABLES.map((t) => `create table if not exists ${t} (id text primary key, pos integer not null, data jsonb not null);`).join("\n")}
create table if not exists uploads (name text primary key, type text not null, size integer not null, body bytea not null, created_at timestamptz not null default now());
-- รหัสจากเนื้อไฟล์ ใช้หาไฟล์ที่อัปโหลดซ้ำ
alter table uploads add column if not exists hash text;
update uploads set hash = encode(sha256(body), 'hex') where hash is null;
create index if not exists uploads_hash on uploads (hash);
-- ชื่อไฟล์เดิมตอนอัปโหลด ใช้แสดงในคลังไฟล์
alter table uploads add column if not exists label text;
`;

// ใช้การเชื่อมต่อชุดเดิมต่อไปเมื่อโค้ดโหลดใหม่ระหว่างพัฒนา
const g = globalThis as unknown as { __gd4pool?: Pool; __gd4schema?: Promise<void> };

export function pool(): Pool {
  if (!g.__gd4pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__gd4pool = new Pool({ connectionString: url, max: 10 });
  }
  return g.__gd4pool;
}

/** สร้างตารางที่ยังไม่มี ทำครั้งเดียวต่อการเปิดเซิร์ฟเวอร์ */
export function ensureSchema(): Promise<void> {
  g.__gd4schema ??= pool()
    .query(SCHEMA)
    .then(() => undefined)
    .catch((e) => {
      g.__gd4schema = undefined;
      throw e;
    });
  return g.__gd4schema;
}

/** ทำงานในธุรกรรมเดียว ถ้ามีข้อผิดพลาดจะยกเลิกทั้งหมด */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>, mode = ""): Promise<T> {
  await ensureSchema();
  const c = await pool().connect();
  try {
    await c.query(`begin ${mode}`);
    const result = await fn(c);
    await c.query("commit");
    return result;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
