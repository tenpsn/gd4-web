import { can, getCurrentUser } from "@/server/auth";
import { saveUpload, type UploadKind } from "@/server/files";
import { mutate, nowStr } from "@/server/store";

/**
 * รับไฟล์ที่แอดมินอัปโหลด ได้แก่รูปภาพ ไฟล์ PDF และฟอนต์
 * แยกเป็นเส้นทางนี้เพื่อให้อัปโหลด PDF ขนาดใหญ่ได้โดยไม่ต้องขยายขีดจำกัดของทั้งระบบ
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(can(user, "products", "edit") || can(user, "content", "edit") || can(user, "design", "edit") || can(user, "settings", "edit"))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  // รับเฉพาะคำขอที่มาจากเว็บของเราเอง เพื่อกันเว็บอื่นแอบส่งฟอร์มเข้ามา
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return Response.json({ error: "forbidden" }, { status: 403 });

  const fd = await req.formData();
  const file = fd.get("file");
  const kind = String(fd.get("kind")) as UploadKind;
  if (!(file instanceof File) || !["image", "pdf", "font"].includes(kind)) return Response.json({ error: "bad" }, { status: 400 });

  const saved = await saveUpload(file, kind);
  if ("error" in saved) return Response.json(saved, { status: 400 });
  // เก็บรูปไว้ในคลังสื่อเพื่อให้นำไปใช้ซ้ำได้
  if (kind === "image") {
    mutate((db) => {
      db.media.unshift({ ...saved, when: nowStr(), userId: user.id });
      db.media = db.media.slice(0, 1000);
    });
  }
  return Response.json(saved);
}
