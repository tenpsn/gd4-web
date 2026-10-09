import type { Metadata } from "next";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { Settings } from "./Settings";

export const metadata: Metadata = { title: "Settings" };

/** ทุกคนที่เข้าสู่ระบบตั้งค่าความปลอดภัยของตัวเองได้ ส่วนแท็บอื่นต้องมีสิทธิ์ตั้งค่า */
export default async function SettingsPage() {
  const user = await requireUser();
  const db = await readDb();
  const full = can(user, "settings", "view");
  return (
    <Settings
      full={full}
      canEdit={can(user, "settings", "edit")}
      canDesign={can(user, "design", "view")}
      settings={db.settings}
      pages={db.pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, seo: p.seo }))}
      design={db.design}
    />
  );
}
