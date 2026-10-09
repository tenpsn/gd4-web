import "server-only";
import { headers } from "next/headers";

/** ที่อยู่หลักของเว็บ ใช้สร้างลิงก์เต็ม เช่น ลิงก์เชิญผู้ดูแล */
export async function baseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
