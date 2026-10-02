"use server";

import { revalidatePath } from "next/cache";
import { readContact, validateContact, type ContactErrors } from "@/lib/contact";
import { mutate, nextId, nowStr } from "@/server/store";

export type ContactResult = { ok: true } | { ok: false; errors?: ContactErrors };

/**
 * รับฟอร์มติดต่อจากหน้าเว็บ แล้วเก็บไว้ในกล่องข้อความของหลังบ้าน ตอนนี้ยังเป็นข้อมูลจำลอง
 * ยังต้องทำ ส่งอีเมลแจ้งทีมขายด้วย
 */
export async function sendContact(fd: FormData): Promise<ContactResult> {
  // ช่องซ่อนสำหรับดักบอท คนจริงจะไม่กรอกช่องนี้
  if (String(fd.get("website") ?? "")) return { ok: true };

  const data = readContact(fd);
  const errors = validateContact(data);
  if (Object.keys(errors).length) return { ok: false, errors };

  try {
    mutate((db) => {
      db.messages.unshift({
        id: nextId(db.messages),
        ...data,
        // ใช้บรรทัดแรกของข้อความเป็นหัวเรื่องในกล่องข้อความ
        subject: data.msg.split("\n")[0].slice(0, 80),
        date: nowStr(),
        status: "new",
      });
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
