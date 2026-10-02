import "server-only";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * ที่เก็บไฟล์ชั่วคราว ไฟล์อัปโหลดเก็บในโฟลเดอร์ data uploads และเปิดผ่านเส้นทาง media
 * ภายหลังจะย้ายไป S3 หรือ Supabase Storage โดยโค้ดที่เรียกใช้เห็นแค่ลิงก์ src เหมือนเดิม
 */
const DIR = path.join(process.cwd(), ".data", "uploads");

export type UploadKind = "image" | "pdf" | "font";

const RULES: Record<UploadKind, { max: number; types: Record<string, string> }> = {
  image: { max: 5 * 1024 * 1024, types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } },
  pdf: { max: 20 * 1024 * 1024, types: { "application/pdf": "pdf" } },
  font: { max: 5 * 1024 * 1024, types: { "font/woff2": "woff2", "font/woff": "woff", "font/ttf": "ttf", "font/otf": "otf" } },
};

/** ตรวจข้อมูลส่วนต้นของไฟล์ เพื่อไม่ให้ไฟล์ที่แค่เปลี่ยนชื่อนามสกุลผ่านไปได้ */
function sniff(buf: Buffer): string | null {
  const h = buf.subarray(0, 12);
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return "image/jpeg";
  if (h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (h.subarray(0, 4).toString("latin1") === "RIFF" && h.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
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
  mkdirSync(DIR, { recursive: true });
  const stored = `${randomUUID()}.${ext}`;
  writeFileSync(path.join(DIR, stored), buf);
  // เก็บชื่อไฟล์เดิมไว้แสดงผล โดยตัดส่วนที่เป็นที่อยู่โฟลเดอร์ออก
  const name = path.basename(file.name).replace(/[^\w.\-ก-๙ ]+/g, "_").slice(0, 120) || stored;
  return { src: `/media/${stored}`, name, size: file.size };
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf",
  woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf",
};

/** อ่านไฟล์ที่อัปโหลดไว้จากชื่อที่ระบบตั้งให้ ถ้าไม่พบหรือชื่อไม่ถูกรูปแบบจะได้ null */
export function readUpload(name: string): { body: Buffer; type: string; size: number } | null {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf|woff2|woff|ttf|otf)$/.test(name)) return null;
  const file = path.join(DIR, name);
  if (!existsSync(file)) return null;
  return { body: readFileSync(file), type: MIME[name.split(".").pop()!], size: statSync(file).size };
}
