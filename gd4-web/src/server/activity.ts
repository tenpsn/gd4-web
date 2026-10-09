import "server-only";
import { TT } from "@/admin/tt.generated";
import type { LText } from "@/types/site";
import { nextId, nowStr } from "./store";
import type { DB } from "./types";

export type ActKey = keyof typeof TT.act;

/** บันทึกประวัติการใช้งาน ต้องเรียกใน mutate ไม่จำกัดจำนวน ผู้มีสิทธิ์ลบเองได้ */
export function logActivity(db: DB, userId: number, act: ActKey | LText, target: LText) {
  const action = typeof act === "string" ? { th: TT.act[act].th, en: TT.act[act].en } : act;
  db.activity.unshift({ id: nextId(db.activity), userId, action, target, when: nowStr() });
}
