"use client";

import { useEffect, useRef, useState } from "react";

/** แยกตัวเลขออกจากข้อความ เช่น 1,200+ ได้ 1200 กับเครื่องหมายบวกด้านหลัง ถ้าไม่มีตัวเลขจะได้ null */
function parse(text: string) {
  const m = text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2];
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { pre: m[1], to: Number(raw.replace(/,/g, "")), post: m[3], decimals, comma: raw.includes(",") };
}

const DURATION = 1600;

/**
 * ตัวเลขที่นับขึ้นจากศูนย์ทุกครั้งที่เลื่อนมาถึง ทั้งตอนเลื่อนลงและเลื่อนขึ้น
 * หน้าเว็บที่สร้างจากเซิร์ฟเวอร์แสดงตัวเลขจริงไว้ก่อน เครื่องที่ปิดภาพเคลื่อนไหวจะเห็นตัวเลขจริงทันที
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    const p = parse(value);
    const el = ref.current;
    if (!p || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fmt = (n: number) =>
      p.pre + (p.comma ? n.toLocaleString("en-US", { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals }) : n.toFixed(p.decimals)) + p.post;

    let raf = 0;
    let counting = false;
    setText(fmt(0));
    const io = new IntersectionObserver(
      ([e]) => {
        // เลื่อนพ้นจอไปทั้งหมดแล้ว กลับไปเริ่มที่ศูนย์ รอนับใหม่เมื่อเลื่อนกลับมา
        if (!e.isIntersecting) {
          cancelAnimationFrame(raf);
          counting = false;
          setText(fmt(0));
          return;
        }
        // เริ่มนับเมื่อเห็นตัวเลขเกินครึ่ง จะได้ไม่นับจบก่อนคนเห็น
        if (counting || e.intersectionRatio < 0.6) return;
        counting = true;
        const start = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - start) / DURATION);
          // เร็วตอนต้นแล้วค่อย ๆ ช้าลงตอนใกล้ถึงตัวเลขจริง
          const eased = 1 - Math.pow(1 - k, 3);
          setText(k < 1 ? fmt(Math.floor(p.to * eased * 10 ** p.decimals) / 10 ** p.decimals) : value);
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      setText(value);
    };
  }, [value]);

  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
