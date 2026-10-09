import "server-only";
import type { PoolClient } from "pg";
import { LIST_TABLES, pool, tx, type ListTable } from "./db";
import { importLegacy } from "./legacy";
import { hashPassword } from "./password";
import { createSeed, DEFAULT_PERMS } from "./seed";
import type { DB } from "./types";

/** ข้อมูลทั้งหมดอยู่ใน PostgreSQL ทุกการอ่านเขียนผ่าน readDb และ mutate
 * จำข้อมูลชุดล่าสุดไว้ในหน่วยความจำ และโหลดใหม่เมื่อเลขรุ่นในฐานข้อมูลเปลี่ยน */

/** เพิ่มเลขนี้ทุกครั้งที่ migrate รู้จักข้อมูลใหม่ เพื่อให้ข้อมูลในฐานข้อมูลถูกปรับตามครั้งเดียว */
const MIGRATE_REV = 15;

// เลขล็อกของฐานข้อมูล ใช้ให้การบันทึกทำทีละครั้งแม้เปิดเซิร์ฟเวอร์หลายตัว
const LOCK = 4204001;

/** วิธีหารหัสของแต่ละรายการ ใช้เป็นคีย์ของแถวในตาราง */
const KEY = {
  users: (x: DB["users"][number]) => String(x.id),
  pages: (x: DB["pages"][number]) => x.id,
  categories: (x: DB["categories"][number]) => x.id,
  products: (x: DB["products"][number]) => x.id,
  messages: (x: DB["messages"][number]) => String(x.id),
  activity: (x: DB["activity"][number]) => String(x.id),
  media: (x: DB["media"][number]) => x.src,
} satisfies Record<ListTable, (x: never) => string>;

/** ค่าที่มีชุดเดียว เก็บในตาราง meta */
const SINGLES = ["version", "settings", "perms", "lastEdit", "design", "draft", "draftRev"] as const satisfies readonly Exclude<keyof DB, ListTable>[];

type Row = { pos: number; json: string };
type Cache = { db: DB; rev: number; snap: Map<string, Row> };

const g = globalThis as unknown as { __gd4cache?: Cache; __gd4loading?: Promise<Cache>; __gd4ready?: Promise<void> };

async function load(c: PoolClient): Promise<Cache> {
  const meta = new Map((await c.query<{ key: string; value: unknown }>("select key, value from meta")).rows.map((r) => [r.key, r.value]));
  const db: Record<string, unknown> = {};
  const snap = new Map<string, Row>();
  for (const k of SINGLES) {
    db[k] = meta.get(k) ?? null;
    snap.set(`meta:${k}`, { pos: 0, json: JSON.stringify(db[k]) });
  }
  for (const t of LIST_TABLES) {
    const { rows } = await c.query<{ id: string; pos: number; data: unknown }>(`select id, pos, data from ${t} order by pos`);
    db[t] = rows.map((r) => r.data);
    for (const r of rows) snap.set(`${t}:${r.id}`, { pos: r.pos, json: JSON.stringify(r.data) });
  }
  return { db: db as DB, rev: Number(meta.get("_rev") ?? 0), snap };
}

/** เขียนเฉพาะแถวที่เปลี่ยนจากครั้งก่อน คืนค่าว่ามีการเปลี่ยนหรือไม่ */
async function persist(c: PoolClient, cache: Cache): Promise<boolean> {
  const db = cache.db as unknown as Record<string, unknown>;
  const next = new Map<string, Row>();
  let changed = false;

  const keys: string[] = [];
  const values: string[] = [];
  for (const k of SINGLES) {
    const json = JSON.stringify(db[k] ?? null);
    next.set(`meta:${k}`, { pos: 0, json });
    if (cache.snap.get(`meta:${k}`)?.json !== json) {
      keys.push(k);
      values.push(json);
    }
  }
  if (keys.length) {
    changed = true;
    await c.query("insert into meta (key, value) select * from unnest($1::text[], $2::jsonb[]) on conflict (key) do update set value = excluded.value", [keys, values]);
  }

  for (const t of LIST_TABLES) {
    const up = { id: [] as string[], pos: [] as number[], data: [] as string[] };
    const moved = { id: [] as string[], pos: [] as number[] };
    (db[t] as never[]).forEach((item, pos) => {
      const id = KEY[t](item);
      const key = `${t}:${id}`;
      if (next.has(key)) throw new Error(`Duplicate id ${id} in ${t}`);
      const json = JSON.stringify(item);
      next.set(key, { pos, json });
      const old = cache.snap.get(key);
      if (old?.json !== json) {
        up.id.push(id);
        up.pos.push(pos);
        up.data.push(json);
      } else if (old.pos !== pos) {
        moved.id.push(id);
        moved.pos.push(pos);
      }
    });
    const gone = [...cache.snap.keys()].filter((k) => k.startsWith(`${t}:`) && !next.has(k)).map((k) => k.slice(t.length + 1));
    if (gone.length) await c.query(`delete from ${t} where id = any($1::text[])`, [gone]);
    if (up.id.length) {
      await c.query(
        `insert into ${t} (id, pos, data) select * from unnest($1::text[], $2::int[], $3::jsonb[]) on conflict (id) do update set pos = excluded.pos, data = excluded.data`,
        [up.id, up.pos, up.data],
      );
    }
    if (moved.id.length) await c.query(`update ${t} set pos = u.pos from unnest($1::text[], $2::int[]) as u(id, pos) where ${t}.id = u.id`, [moved.id, moved.pos]);
    if (gone.length || up.id.length || moved.id.length) changed = true;
  }

  cache.snap = next;
  return changed;
}

const setMeta = (c: PoolClient, key: string, value: unknown) =>
  c.query("insert into meta (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value", [key, JSON.stringify(value)]);

/** เติมข้อมูลที่เพิ่มมาทีหลังให้ข้อมูลเก่ายังใช้งานได้ */
function migrate(db: DB): DB {
  const seed = createSeed();
  const st = db.settings as Partial<DB["settings"]> & { name?: string };
  db.settings = { ...seed.settings, ...st, siteName: st.siteName ?? { th: st.name ?? "GD4 Medical", en: st.name ?? "GD4 Medical" } } as DB["settings"];
  delete (db.settings as { name?: string }).name;
  // เลิกใช้ระบบสำรองข้อมูลแล้ว จึงตัดข้อมูลที่เหลือของระบบนั้นออก
  delete (db as { backups?: unknown }).backups;
  delete (db.settings as { autoBackup?: boolean }).autoBackup;
  // เลิกใช้แท็บตั้งค่าภาษาแล้ว หน้าเว็บกำหนดภาษาไว้ในโค้ด
  delete (db.settings as { languages?: unknown }).languages;
  db.media ??= [];
  // เพิ่มสิทธิ์ของประวัติการแก้ไข
  for (const r of Object.keys(DEFAULT_PERMS) as (keyof typeof DEFAULT_PERMS)[]) {
    if (db.perms[r]) db.perms[r].activity ??= structuredClone(DEFAULT_PERMS[r].activity);
    // ลบประวัติได้เฉพาะผู้ดูแลสูงสุด
    if (r !== "super" && db.perms[r]) db.perms[r].activity.del = false;
  }
  db.design ??= seed.design;
  // เพิ่มมุมโค้งของปุ่ม รูปภาพ และช่องกรอก ค่าเริ่มต้นเท่ากับหน้าตาเดิม
  for (const d of [db.design, db.draft?.design]) {
    if (!d) continue;
    d.btnRadius ??= seed.design.btnRadius;
    d.imgRadius ??= seed.design.imgRadius;
    d.inputRadius ??= seed.design.inputRadius;
  }
  // เลิกใช้การย้อนกลับเวอร์ชันแล้ว
  delete (db as { versions?: unknown }).versions;
  // ไฟล์ข้อมูลตัวอย่างเก็บรหัสผ่านแบบอ่านได้ ต้องเข้ารหัสก่อนเก็บลงฐานข้อมูลเสมอ
  for (const u of db.users as (DB["users"][number] & { password?: string })[]) {
    if (typeof u.password === "string") u.passwordHash = u.password ? hashPassword(u.password) : null;
    delete u.password;
  }
  // เลิกใช้ช่องคำอธิบายรูปแล้ว รูปใช้หัวข้อของส่วนนั้นแทน
  for (const p of [...db.pages, ...(db.draft?.pages ?? [])]) {
    for (const s of p.sections as { imgAlt?: unknown; items?: { imgAlt?: unknown }[] }[]) {
      delete s.imgAlt;
      if (Array.isArray(s.items)) for (const it of s.items) delete it.imgAlt;
    }
  }
  db.draft ??= null;
  db.draftRev ??= 0;
  if (db.draft && !db.draft.global) db.draft = null;
  // เลิกใช้พิกัดแล้ว แผนที่ใช้โค้ดฝังแผนที่ของ Google Maps แทน
  for (const c of [db.settings.contact, db.draft?.global.contact] as (Record<string, unknown> | undefined)[]) {
    if (!c) continue;
    delete c.lat;
    delete c.lng;
    c.mapEmbed ??= "";
  }
  for (const p of db.pages) {
    const sp = seed.pages.find((x) => x.id === p.id);
    p.inMenu ??= sp?.inMenu ?? false;
    p.system ??= sp?.system ?? false;
  }
  return db;
}

/** เตรียมฐานข้อมูลครั้งแรก ถ้ายังว่างจะนำข้อมูลจากโฟลเดอร์ .data หรือข้อมูลตั้งต้นมาใส่ */
async function init() {
  await tx(async (c) => {
    await c.query("select pg_advisory_xact_lock($1)", [LOCK]);
    const { rows } = await c.query<{ value: number }>("select value from meta where key = '_migrate'");
    if (rows.length && Number(rows[0].value) >= MIGRATE_REV) return;
    let cache: Cache;
    if (rows.length) {
      // ตารางของระบบสำรองข้อมูลที่เลิกใช้แล้ว
      await c.query("drop table if exists backups, backup_files, versions");
      cache = await load(c);
    } else {
      const legacy = await importLegacy(c);
      cache = { db: legacy ?? createSeed(), rev: 0, snap: new Map() };
    }
    migrate(cache.db);
    await persist(c, cache);
    await setMeta(c, "_rev", cache.rev + 1);
    await setMeta(c, "_migrate", MIGRATE_REV);
  });
}

function ready(): Promise<void> {
  g.__gd4ready ??= init().catch((e) => {
    g.__gd4ready = undefined;
    throw e;
  });
  return g.__gd4ready;
}

export async function readDb(): Promise<DB> {
  await ready();
  const { rows } = await pool().query<{ value: number }>("select value from meta where key = '_rev'");
  const rev = Number(rows[0]?.value ?? 0);
  if (g.__gd4cache?.rev !== rev) {
    g.__gd4loading ??= tx(load, "isolation level repeatable read read only").finally(() => (g.__gd4loading = undefined));
    g.__gd4cache = await g.__gd4loading;
  }
  return g.__gd4cache.db;
}

/** แก้ข้อมูลแล้วบันทึกลงฐานข้อมูลทันที ทำทีละครั้งจึงไม่ทับกัน ถ้าบันทึกไม่สำเร็จจะไม่มีอะไรเปลี่ยน */
export async function mutate<T>(fn: (db: DB) => T): Promise<T> {
  await ready();
  try {
    return await tx(async (c) => {
      await c.query("select pg_advisory_xact_lock($1)", [LOCK]);
      const { rows } = await c.query<{ value: number }>("select value from meta where key = '_rev'");
      const rev = Number(rows[0]?.value ?? 0);
      let cache = g.__gd4cache;
      if (cache?.rev !== rev) cache = g.__gd4cache = await load(c);
      const result = fn(cache.db);
      if (await persist(c, cache)) {
        cache.rev = rev + 1;
        await setMeta(c, "_rev", cache.rev);
      }
      return result;
    });
  } catch (e) {
    // ข้อมูลในหน่วยความจำอาจถูกแก้ไปบางส่วนแล้ว จึงทิ้งไปและโหลดใหม่รอบหน้า
    g.__gd4cache = undefined;
    throw e;
  }
}

/** วันที่และเวลาปัจจุบันตามเวลาประเทศไทย ในรูปแบบเดียวกับข้อมูลตั้งต้น */
export function nowStr(): string {
  const d = new Date(Date.now() + 7 * 3600_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export const nextId = (list: { id: number }[]) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
