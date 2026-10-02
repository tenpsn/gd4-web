import { AdminShell } from "@/admin/AdminShell";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { AREAS } from "@/server/types";

/** โครงของทุกหน้าหลังบ้าน ตรวจการเข้าระบบก่อน แล้วแสดงเมนูข้างและแถบด้านบน */
export default async function AdminAppLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const areas = AREAS.filter((a) => can(user, a, "view"));
  const newMessages = areas.includes("inbox") ? readDb().messages.filter((m) => m.status === "new").length : 0;
  return (
    <AdminShell user={user} areas={areas} newMessages={newMessages}>
      {children}
    </AdminShell>
  );
}
