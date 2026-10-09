"use server";

import { getCurrentUser } from "@/server/auth";
import { readDb } from "@/server/store";

/** รายการรูปในคลังสื่อ เรียงจากใหม่ไปเก่า */
export async function listMedia() {
  if (!(await getCurrentUser())) throw new Error("Forbidden");
  return (await readDb()).media.map(({ src, name, size, when }) => ({ src, name, size, when }));
}
