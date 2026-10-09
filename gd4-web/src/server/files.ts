import "server-only";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { ensureSchema, pool } from "./db";

/**
 * ไฟล์อัปโหลดเก็บในตาราง uploads ของฐานข้อมูล และเปิดผ่านเส้นทาง media
 * ถ้าภายหลังย้ายไป S3 โค้ดที่เรียกใช้ยังเห็นแค่ลิงก์ src เหมือนเดิม
 */

export type UploadKind = "image" | "icon" | "pdf" | "font";

const RULES: Record<UploadKind, { max: number; types: Record<string, string> }> = {
  image: { max: 5 * 1024 * 1024, types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } },
  // ไอคอนเว็บรับ ICO เพิ่มจากรูปทั่วไป
  icon: { max: 5 * 1024 * 1024, types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/x-icon": "ico" } },
  pdf: { max: 20 * 1024 * 1024, types: { "application/pdf": "pdf" } },
  font: { max: 5 * 1024 * 1024, types: { "font/woff2": "woff2", "font/woff": "woff", "font/ttf": "ttf", "font/otf": "otf" } },
};

/** ตรวจข้อมูลส่วนต้นของไฟล์ เพื่อไม่ให้ไฟล์ที่แค่เปลี่ยนชื่อนามสกุลผ่านไปได้ */
function sniff(buf: Buffer): string | null {
  const h = buf.subarray(0, 12);
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return "image/jpeg";
  if (h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (h.subarray(0, 4).toString("latin1") === "RIFF" && h.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (h[0] === 0x00 && h[1] === 0x00 && h[2] === 0x01 && h[3] === 0x00) return "image/x-icon";
  if (h.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  const sig = h.subarray(0, 4).toString("latin1");
  if (sig === "wOF2") return "font/woff2";
  if (sig === "wOFF") return "font/woff";
  if (sig === "OTTO") return "font/otf";
  if (h[0] === 0x00 && h[1] === 0x01 && h[2] === 0x00 && h[3] === 0x00) return "font/ttf";
  return null;
}

export type Saved = { src: string; name: string; size: number };

export async function saveUpload(file: File, kind: UploadKind): Promise<Saved | { error: "type" | "size" }> {
  const rule = RULES[kind];
  if (file.size > rule.max) return { error: "size" };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  const ext = type ? rule.types[type] : undefined;
  if (!ext) return { error: "type" };
  // เก็บชื่อไฟล์เดิมไว้แสดงผล โดยตัดส่วนที่เป็นที่อยู่โฟลเดอร์ออก
  const name = (fallback: string) => path.basename(file.name).replace(/[^\w.\-ก-๙ ]+/g, "_").slice(0, 120) || fallback;
  const hash = createHash("sha256").update(buf).digest("hex");
  await ensureSchema();
  // ไฟล์เนื้อหาเดียวกันที่เคยอัปโหลดแล้วใช้ไฟล์เดิม เลือกไฟล์แรกสุดเสมอเพื่อให้ได้ลิงก์เดียวกันทุกครั้ง
  const { rows } = await pool().query<{ name: string }>("select name from uploads where hash = $1 and type = $2 order by created_at, name limit 1", [hash, type]);
  if (rows[0]) return { src: `/media/${rows[0].name}`, name: name(rows[0].name), size: buf.length };
  const stored = `${randomUUID()}.${ext}`;
  await pool().query("insert into uploads (name, type, size, body, hash, label) values ($1, $2, $3, $4, $5, $6)", [stored, type, buf.length, buf, hash, name(stored)]);
  return { src: `/media/${stored}`, name: name(stored), size: buf.length };
}

/** ลบไฟล์ที่อัปโหลดไว้ตามลิงก์ src */
export async function deleteUpload(src: string): Promise<void> {
  const name = src.replace(/^\/media\//, "");
  if (!UPLOAD_NAME.test(name)) return;
  await ensureSchema();
  await pool().query("delete from uploads where name = $1", [name]);
}

export const MIME: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", ico: "image/x-icon", pdf: "application/pdf",
  woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf",
};

/** รูปแบบชื่อไฟล์ที่ระบบตั้งให้ */
export const UPLOAD_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|ico|pdf|woff2|woff|ttf|otf)$/;

/** อ่านไฟล์ที่อัปโหลดไว้จากชื่อที่ระบบตั้งให้ ถ้าไม่พบหรือชื่อไม่ถูกรูปแบบจะได้ null */
export async function readUpload(name: string): Promise<{ body: Buffer; type: string; size: number } | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  await ensureSchema();
  const { rows } = await pool().query<{ body: Buffer; type: string; size: number }>("select body, type, size from uploads where name = $1", [name]);
  return rows[0] ?? null;
}

/** ประเภทไฟล์ที่แสดงในแท็บไฟล์ของคลัง ไอคอนเว็บอยู่ในแท็บรูป ฟอนต์จัดการในหน้าธีมและตัวอักษร */
export const FILE_TYPES = ["application/pdf"];

/** รายการไฟล์ในแท็บไฟล์ของคลัง เรียงจากใหม่ไปเก่า ไม่ดึงเนื้อไฟล์ */
export async function listUploadFiles(): Promise<{ src: string; label: string | null; type: string; size: number; when: Date }[]> {
  await ensureSchema();
  const { rows } = await pool().query<{ name: string; label: string | null; type: string; size: number; created_at: Date }>(
    "select name, label, type, size, created_at from uploads where type = any($1::text[]) order by created_at desc",
    [FILE_TYPES],
  );
  return rows.map((r) => ({ src: `/media/${r.name}`, label: r.label, type: r.type, size: r.size, when: r.created_at }));
}
