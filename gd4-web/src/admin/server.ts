import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "@/types/site";
import { ADMIN_LANG_COOKIE } from "./i18n";

/** ภาษาของหน้าแอดมินที่ผู้ใช้เลือกไว้ ถ้ายังไม่เลือกจะเป็นภาษาไทย */
export async function getAdminLang(): Promise<Locale> {
  return (await cookies()).get(ADMIN_LANG_COOKIE)?.value === "en" ? "en" : "th";
}
