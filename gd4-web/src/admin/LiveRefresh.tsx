"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { inboxPulse } from "@/app/admin/actions/inbox";
import { useAdmin } from "./context";
import { isDirty, useToast } from "./ui";

// หน้าที่ใช้ดูข้อมูลอย่างเดียว อัปเดตเนื้อหาในหน้าได้โดยไม่กระทบสิ่งที่ผู้ใช้กำลังทำ
const VIEW_PAGES = ["/admin", "/admin/inbox"];
const EVERY = 60_000;

/**
 * เช็คข้อความใหม่ทุก 1 นาที และทันทีที่กลับมาที่แท็บนี้ ไม่เช็คตอนแท็บถูกซ่อน
 * หน้าที่กำลังกรอกข้อมูลอัปเดตแค่ตัวเลขบนเมนู ส่วนหน้าที่ใช้ดูข้อมูลโหลดเนื้อหาใหม่ด้วย
 */
export function LiveRefresh({ latest, inbox, onUnread }: { latest: number; inbox: boolean; onUnread: (n: number) => void }) {
  const { lang } = useAdmin();
  const toast = useToast();
  const router = useRouter();
  const path = usePathname();
  // รหัสข้อความล่าสุดที่เคยเห็น ใช้นับว่ามีข้อความใหม่เข้ามากี่รายการ
  const seen = useRef(latest);
  const tick = useRef<() => void>(() => {});

  // หน้าโหลดใหม่แล้วเห็นข้อความล่าสุดแล้ว จึงไม่ต้องแจ้งเตือนซ้ำ
  useEffect(() => {
    seen.current = Math.max(seen.current, latest);
  }, [latest]);

  // ใช้ค่าล่าสุดของหน้าและภาษาเสมอ โดยไม่ต้องตั้งเวลาใหม่ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    tick.current = async () => {
      if (document.visibilityState !== "visible") return;
      if (inbox) {
        try {
          const p = await inboxPulse(seen.current);
          onUnread(p.unread);
          if (p.fresh > 0) {
            const msg = lang === "th" ? `มีข้อความใหม่ ${p.fresh} รายการ` : `${p.fresh} new message${p.fresh > 1 ? "s" : ""}`;
            // ปุ่มเปิดดูจะไม่แสดงตอนมีงานที่ยังไม่บันทึก กันงานหายจากการเปลี่ยนหน้า
            const open = path !== "/admin/inbox" && !isDirty() ? { label: lang === "th" ? "เปิดดู" : "View", run: () => router.push("/admin/inbox?filter=new") } : undefined;
            toast("ok", msg, open);
          }
          seen.current = Math.max(seen.current, p.latest);
        } catch {
          // เน็ตหลุดชั่วคราว รอบถัดไปค่อยลองใหม่
        }
      }
      if (VIEW_PAGES.includes(path) && !isDirty()) router.refresh();
    };
  });

  useEffect(() => {
    const run = () => tick.current();
    const timer = window.setInterval(run, EVERY);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);

  return null;
}
