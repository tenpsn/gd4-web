"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

/** สื่อสารกับหน้าแก้ไขที่เปิดหน้านี้ไว้ใน iframe คลิกส่วนใดจะเปิดส่วนนั้นให้แก้
 * เมื่อบันทึกร่างจะรีเฟรชโดยคงตำแหน่งเดิม และเมื่อเลือกส่วนจะเลื่อนไปที่ส่วนนั้น */
export function PreviewBridge({ theme, lang }: { theme: "light" | "dark"; lang: "th" | "en" }) {
  const router = useRouter();

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

  useEffect(() => {
    const origin = window.location.origin;
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("a,form [type=submit]")) e.preventDefault();
      // ปุ่มเปลี่ยนภาษาของเว็บจะพาออกจากหน้าตัวอย่าง
      // จึงให้หน้าแก้ไขเปลี่ยนภาษาแทน แล้วโหลดหน้าตัวอย่างใหม่ในภาษานั้น
      if (el.closest('header [role="group"]')) {
        e.preventDefault();
        e.stopPropagation();
        const l = el.closest<HTMLElement>("button[lang]")?.getAttribute("lang");
        if (l === "th" || l === "en") window.parent.postMessage({ type: "gd4-lang", lang: l }, origin);
        return;
      }
      const sec = el.closest<HTMLElement>("[data-sec-id]");
      if (sec) window.parent.postMessage({ type: "gd4-select", id: sec.dataset.secId }, origin);
    };
    const onSubmit = (e: Event) => e.preventDefault();
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin) return;
      if (e.data?.type === "gd4-refresh") router.refresh();
      if (e.data?.type === "gd4-focus") {
        const el = document.querySelector<HTMLElement>(`[data-sec-id="${CSS.escape(String(e.data.id))}"]`);
        if (el) {
          document.querySelectorAll("[data-sec-on]").forEach((x) => x.removeAttribute("data-sec-on"));
          el.setAttribute("data-sec-on", "1");
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "gd4-ready" }, origin);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("message", onMsg);
    };
  }, [router]);

  return (
    <style>{`
      [data-sec-id]{cursor:pointer;outline-offset:-3px}
      [data-sec-id]:hover{outline:2px dashed rgba(42,95,184,.55)}
      [data-sec-on]{outline:3px solid #e8483d !important}
      html{scroll-padding-top:0}
    `}</style>
  );
}
