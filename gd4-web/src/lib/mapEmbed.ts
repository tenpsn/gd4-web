/**
 * ดึงลิงก์แผนที่จากโค้ดฝังแผนที่ของ Google Maps รับทั้งโค้ด iframe ทั้งก้อนหรือเฉพาะลิงก์
 * ถ้าไม่ใช่ลิงก์ฝังแผนที่ของ Google จะคืนค่าว่าง เพื่อไม่ให้มีหน้าเว็บอื่นแทรกเข้ามาในเว็บ
 */
export function mapEmbedSrc(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = (m ? m[1] : raw).replace(/&amp;/g, "&");
  try {
    const u = new URL(url);
    const ok = u.protocol === "https:" && /^(www\.)?google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith("/maps/embed");
    return ok ? u.toString() : "";
  } catch {
    return "";
  }
}
