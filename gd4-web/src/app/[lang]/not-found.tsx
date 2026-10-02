import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";

// หน้านี้ไม่รู้ภาษาของผู้ชม จึงตั้งชื่อหน้าไว้ทั้งสองภาษา
// ส่วนเนื้อหาจะอ่านภาษาจาก LangProvider
export const metadata: Metadata = { title: "ไม่พบหน้า / Page not found" };

export default function NotFound() {
  return <NotFoundView />;
}
