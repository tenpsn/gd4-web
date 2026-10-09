"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan, can, getCurrentUser } from "@/server/auth";
import { mutate, readDb } from "@/server/store";
import type { MessageStatus } from "@/server/types";

const STATUSES: MessageStatus[] = ["new", "read", "replied"];

/** สรุปกล่องข้อความแบบสั้น ใช้เช็คข้อความใหม่จากทุกหน้าของหลังบ้าน */
export async function inboxPulse(since: number): Promise<{ unread: number; latest: number; fresh: number }> {
  const user = await getCurrentUser();
  if (!user || !can(user, "inbox")) return { unread: 0, latest: 0, fresh: 0 };
  const { messages } = await readDb();
  const after = Number(since) || 0;
  return {
    unread: messages.filter((m) => m.status === "new").length,
    latest: messages.reduce((n, m) => Math.max(n, m.id), 0),
    fresh: messages.filter((m) => m.id > after).length,
  };
}

export async function setMessageStatus(ids: number[], status: MessageStatus) {
  const user = await assertCan("inbox", "edit");
  if (!STATUSES.includes(status)) throw new Error("Bad status");
  const set = new Set(ids.map(Number));
  await mutate((db) => {
    for (const m of db.messages) {
      if (!set.has(m.id) || m.status === status) continue;
      m.status = status;
      if (status === "replied") logActivity(db, user.id, "replied", { th: m.company || m.name, en: m.company || m.name });
    }
  });
  revalidatePath("/admin", "layout");
}

export async function deleteMessages(ids: number[]) {
  const user = await assertCan("inbox", "del");
  const set = new Set(ids.map(Number));
  const n = await mutate((db) => {
    const before = db.messages.length;
    db.messages = db.messages.filter((m) => !set.has(m.id));
    const n = before - db.messages.length;
    if (n) logActivity(db, user.id, { th: "ลบข้อความ", en: "deleted messages" }, { th: `${n} ข้อความ`, en: `${n} messages` });
    return n;
  });
  revalidatePath("/admin", "layout");
  return n;
}
