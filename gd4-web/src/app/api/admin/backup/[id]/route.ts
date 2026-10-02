import { can, getCurrentUser } from "@/server/auth";
import { readBackup } from "@/server/backup";

/** ดาวน์โหลดไฟล์สำรองข้อมูล มีแค่เนื้อหาและการตั้งค่า ไม่มีข้อมูลผู้ใช้ */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/backup/[id]">) {
  const user = await getCurrentUser();
  if (!user || !can(user, "settings", "view")) return new Response("Forbidden", { status: 403 });
  const { id } = await ctx.params;
  const b = readBackup(id);
  if (!b) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(b, null, 1), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="gd4-backup-${b.created.replace(/[^\d]/g, "").slice(0, 12)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
