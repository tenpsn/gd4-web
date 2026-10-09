import "server-only";
import { deleteUpload } from "./files";
import { mutate } from "./store";
import type { DB } from "./types";

/** ข้อมูลทุกส่วนที่อาจอ้างถึงไฟล์อัปโหลด รวมถึงฉบับร่างที่ยังไม่เผยแพร่ */
export const usedText = (db: DB) => JSON.stringify([db.pages, db.products, db.categories, db.settings, db.design, db.draft]);

const srcsIn = (text: string) => new Set(text.match(/\/media\/[0-9a-f-]{36}\.[a-z0-9]+/g) ?? []);

/**
 * บันทึกข้อมูลเหมือน mutate แล้วลบไฟล์ที่ไม่มีที่ไหนใช้แล้วหลังการเปลี่ยนครั้งนี้ เช่น ฟอนต์ที่ถูกเปลี่ยน
 * ดูเฉพาะไฟล์ที่เคยถูกอ้างถึงก่อนเปลี่ยน ไฟล์ที่เพิ่งอัปโหลดแต่ฟอร์มยังไม่บันทึกจึงไม่ถูกลบ
 * รูปในคลังและไฟล์ PDF ไม่ลบ เพราะเก็บไว้ในคลังให้เลือกใช้ซ้ำ ต้องลบเองจากคลัง
 */
export async function mutateAndPrune<T>(fn: (db: DB) => T): Promise<T> {
  let unused: string[] = [];
  const result = await mutate((db) => {
    const before = srcsIn(usedText(db));
    const out = fn(db);
    const after = usedText(db);
    const library = new Set(db.media.map((m) => m.src));
    unused = [...before].filter((s) => !after.includes(s) && !library.has(s) && !s.endsWith(".pdf"));
    return out;
  });
  for (const src of unused) await deleteUpload(src);
  return result;
}
