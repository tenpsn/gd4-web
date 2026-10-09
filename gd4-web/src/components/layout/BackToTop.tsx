"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";

/** ปุ่มกลับขึ้นด้านบนที่มุมขวาล่าง แสดงเมื่อเลื่อนลงไปเกินหนึ่งหน้าจอ */
export function BackToTop() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
      }}
      aria-label={t.toTop}
      title={t.toTop}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`fixed bottom-5 right-5 z-20 grid size-12 cursor-pointer place-items-center rounded-full border border-line bg-card text-primary shadow-[0_10px_28px_-10px_rgba(0,0,0,.45)] transition-[opacity,transform] duration-300 hover:bg-primary-solid hover:text-white ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <Icon name="arrowU" size={22} />
    </button>
  );
}
