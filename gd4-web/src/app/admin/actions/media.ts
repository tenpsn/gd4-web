"use server";

import { logActivity } from "@/server/activity";
import { can, getCurrentUser, type CurrentUser } from "@/server/auth";
import { usedText } from "@/server/cleanup";
import { deleteUpload, listUploadFiles } from "@/server/files";
import { mutate, readDb } from "@/server/store";

/** ใช้สิทธิ์ชุดเดียวกับการอัปโหลด */
const canManage = (user: CurrentUser | null): user is CurrentUser =>
  !!user && (can(user, "products", "edit") || can(user, "content", "edit") || can(user, "design", "edit") || can(user, "settings", "edit"));

/** รายการรูปในคลังสื่อ เรียงจากใหม่ไปเก่า พร้อมบอกว่าใช้อยู่ที่ไหนในเว็บหรือไม่ */
export async function listMedia() {
  if (!(await getCurrentUser())) throw new Error("Forbidden");
  const db = await readDb();
  const used = usedText(db);
  return db.media.map(({ src, name, size, when }) => ({ src, name, size, when, used: used.includes(src) }));
}

/** ลบรูปออกจากคลังและลบไฟล์ทิ้ง ถ้ารูปยังถูกใช้อยู่ที่ไหนจะไม่ลบ */
export async function deleteMedia(src: string): Promise<{ ok: true } | { ok: false; error: "inUse" | "forbidden" }> {
  const user = await getCurrentUser();
  if (!canManage(user)) return { ok: false, error: "forbidden" };
  const result = await mutate((db) => {
    const item = db.media.find((m) => m.src === src);
    if (!item) return "gone" as const;
    // หาลิงก์รูปในข้อมูลทุกส่วนที่แสดงบนเว็บ รวมถึงฉบับร่างที่ยังไม่เผยแพร่
    const used = usedText(db).includes(src);
    if (used) return "inUse" as const;
    db.media = db.media.filter((m) => m.src !== src);
    logActivity(db, user.id, { th: "ลบรูปจากคลัง", en: "deleted image" }, { th: item.name, en: item.name });
    return "ok" as const;
  });
  if (result === "inUse") return { ok: false, error: "inUse" };
  if (result === "ok") await deleteUpload(src);
  return { ok: true };
}

export type FileItem = { src: string; name: string; type: string; size: number; when: string; used: boolean };

/** รายการไฟล์ PDF ในแท็บไฟล์ของคลัง พร้อมบอกว่าใช้อยู่หรือไม่ */
export async function listFiles(): Promise<FileItem[]> {
  if (!(await getCurrentUser())) throw new Error("Forbidden");
  const db = await readDb();
  const used = usedText(db);
  // ไฟล์ที่อัปโหลดก่อนมีการเก็บชื่อเดิม ใช้ชื่อจากสินค้าที่ใช้ไฟล์นั้นแทน
  const names = new Map<string, string>();
  for (const p of db.products) if (p.pdf) names.set(p.pdf.src, p.pdf.name);
  return (await listUploadFiles()).map((f) => ({
    src: f.src,
    name: f.label ?? names.get(f.src) ?? f.src.split("/").pop()!,
    type: f.type,
    size: f.size,
    when: f.when.toISOString(),
    used: used.includes(f.src),
  }));
}

/** ลบไฟล์ในแท็บไฟล์ของคลัง ถ้ายังถูกใช้อยู่ที่ไหนจะไม่ลบ */
export async function deleteFile(src: string): Promise<{ ok: true } | { ok: false; error: "inUse" | "forbidden" }> {
  const user = await getCurrentUser();
  if (!canManage(user)) return { ok: false, error: "forbidden" };
  const file = (await listUploadFiles()).find((f) => f.src === src);
  if (!file) return { ok: true };
  const result = await mutate((db) => {
    if (usedText(db).includes(src)) return "inUse" as const;
    const name = file.label ?? src.split("/").pop()!;
    logActivity(db, user.id, { th: "ลบไฟล์จากคลัง", en: "deleted file" }, { th: name, en: name });
    return "ok" as const;
  });
  if (result === "inUse") return { ok: false, error: "inUse" };
  await deleteUpload(src);
  return { ok: true };
}
