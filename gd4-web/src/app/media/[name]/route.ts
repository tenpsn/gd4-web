import { readUpload } from "@/server/files";

/** ส่งไฟล์ที่อัปโหลดจากหลังบ้าน ซึ่งตอนนี้เก็บไว้ในเครื่องชั่วคราว */
export async function GET(_req: Request, ctx: RouteContext<"/media/[name]">) {
  const { name } = await ctx.params;
  const file = readUpload(name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.size),
      // ชื่อไฟล์สุ่มไม่ซ้ำกัน เนื้อหาจึงไม่เปลี่ยน เก็บแคชได้นาน
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(file.type === "application/pdf" ? { "Content-Disposition": "inline" } : {}),
    },
  });
}
