import "server-only";
import { getSettings } from "@/lib/content";
import type { BrandInfo } from "./Brand";
import { getAdminLang } from "./server";

/** โลโก้และชื่อเว็บจากหน้าตั้งค่า ชื่อใช้ตามภาษาที่เลือกในหลังบ้าน */
export async function getBrand(): Promise<BrandInfo> {
  const [s, lang] = await Promise.all([getSettings(), getAdminLang()]);
  return { name: s.siteName[lang] || s.siteName.th || "GD4 Medical", logo: s.logo, logoDark: s.logoDark };
}
