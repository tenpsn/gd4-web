"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan } from "@/server/auth";
import { mutate } from "@/server/store";

/** ลบประวัติการแก้ไขที่เลือก ต้องมีสิทธิ์ลบประวัติการแก้ไข คืนจำนวนที่ลบได้ */
export async function deleteActivity(ids: number[]): Promise<number> {
  const me = await assertCan("activity", "del");
  const set = new Set((Array.isArray(ids) ? ids : []).map(Number));
  const n = await mutate((db) => {
    const before = db.activity.length;
    db.activity = db.activity.filter((a) => !set.has(a.id));
    const n = before - db.activity.length;
    // บันทึกการลบไว้ด้วยเพื่อให้รู้ว่าใครลบประวัติไปกี่รายการ
    if (n) logActivity(db, me.id, { th: "ลบประวัติ", en: "deleted activity" }, { th: `${n} รายการ`, en: `${n} entries` });
    return n;
  });
  revalidatePath("/admin", "layout");
  return n;
}
