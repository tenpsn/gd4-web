import type { Metadata } from "next";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { Settings } from "./Settings";

export const metadata: Metadata = { title: "Settings" };

/** ทุกคนที่เข้าสู่ระบบตั้งค่าความปลอดภัยของตัวเองได้ ส่วนแท็บอื่นต้องมีสิทธิ์ตั้งค่า */
export default async function SettingsPage() {
  const user = await requireUser();
  const db = readDb();
  const full = can(user, "settings", "view");
  const me = db.users.find((u) => u.id === user.id)!;
  return (
    <Settings
      full={full}
      canEdit={can(user, "settings", "edit")}
      canDesign={can(user, "design", "view")}
      settings={db.settings}
      pages={db.pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, seo: p.seo }))}
      design={db.design}
      backups={full ? db.backups : []}
      versions={full ? db.versions.map(({ v, when, userId, note }) => ({ v, when, userId, note })) : []}
      users={Object.fromEntries(db.users.map((u) => [u.id, u.name]))}
      email={me.email}
    />
  );
}
