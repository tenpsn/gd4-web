"use client";

import { useEffect } from "react";

/**
 * ให้แต่ละส่วนของหน้าค่อย ๆ ลอยขึ้นทุกครั้งที่เข้ามาในจอ ทั้งตอนเลื่อนลงและเลื่อนขึ้น
 * ใส่คลาส in เมื่อส่วนนั้นเข้ามาในจอ และเอาออกเมื่อออกไปพ้นจอ ส่วนหน้าตาอยู่ใน globals.css
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (!("reveal" in root.dataset)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("in", e.isIntersecting);
      },
      // นับว่าเข้ามาในจอเมื่อพ้นขอบล่างขึ้นมาเล็กน้อย จะได้เห็นตอนลอยขึ้น
      { rootMargin: "0px 0px -10% 0px" },
    );
    const watch = () => document.querySelectorAll("[data-sec]").forEach((el) => io.observe(el));
    watch();
    // เปลี่ยนหน้าโดยไม่โหลดใหม่ ส่วนของหน้าใหม่จะถูกเพิ่มเข้ามาภายหลัง
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
