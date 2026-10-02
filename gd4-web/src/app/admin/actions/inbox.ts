"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan } from "@/server/auth";
import { mutate } from "@/server/store";
import type { MessageStatus } from "@/server/types";

const STATUSES: MessageStatus[] = ["new", "read", "replied"];

export async function setMessageStatus(ids: number[], status: MessageStatus) {
  const user = await assertCan("inbox", "edit");
  if (!STATUSES.includes(status)) throw new Error("Bad status");
  const set = new Set(ids.map(Number));
  mutate((db) => {
    for (const m of db.messages) {
      if (!set.has(m.id) || m.status === status) continue;
      m.status = status;
      if (status === "replied") logActivity(db, user.id, "replied", { th: m.company || m.name, en: m.company || m.name });
    }
  });
  revalidatePath("/admin", "layout");
}

export async function deleteMessages(ids: number[]) {
  await assertCan("inbox", "del");
  const set = new Set(ids.map(Number));
  const n = mutate((db) => {
    const before = db.messages.length;
    db.messages = db.messages.filter((m) => !set.has(m.id));
    return before - db.messages.length;
  });
  revalidatePath("/admin", "layout");
  return n;
}
