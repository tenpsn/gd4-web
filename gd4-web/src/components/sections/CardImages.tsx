"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Media } from "@/components/Media";
import { useI18n } from "@/i18n/client";
import type { Img } from "@/types/site";

/**
 * รูปในการ์ดสินค้าที่มีหลายรูป เลื่อนดูได้ด้วยลูกศรตอนชี้เมาส์ หรือปัดบนมือถือ และมีจุดบอกลำดับรูป
 * ตอนปัดจะไม่นับเป็นการกดการ์ด ส่วนการแตะธรรมดายังพาไปหน้ารายละเอียดสินค้าเหมือนเดิม
 */
export function CardImages({ images, start, alt, sizes }: { images: { id: string; src: Img }[]; start: number; alt: string; sizes: string }) {
  const { t } = useI18n();
  const n = images.length;
  const [i, setI] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const go = (k: number) => setI(((k % n) + n) % n);

  useEffect(() => {
    const card = ref.current?.closest("article");
    if (!card || n < 2) return;
    let x0: number | null = null;
    let swiped = false;
    const onStart = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
      swiped = false;
    };
    const onEnd = (e: TouchEvent) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      // ปัดเกิน 40 พิกเซลถือว่าตั้งใจเลื่อนรูป
      if (Math.abs(dx) > 40) {
        swiped = true;
        // กันแค่การกดที่เกิดต่อจากการปัดทันที การกดครั้งถัดไปยังเปิดหน้าสินค้าได้ตามปกติ
        window.setTimeout(() => (swiped = false), 350);
        setI((c) => (((dx < 0 ? c + 1 : c - 1) % n) + n) % n);
      }
    };
    // ปัดแล้วไม่ให้เปิดหน้ารายละเอียดสินค้า
    const onClick = (e: MouseEvent) => {
      if (!swiped) return;
      swiped = false;
      e.preventDefault();
      e.stopPropagation();
    };
    card.addEventListener("touchstart", onStart, { passive: true });
    card.addEventListener("touchend", onEnd);
    card.addEventListener("click", onClick, true);
    return () => {
      card.removeEventListener("touchstart", onStart);
      card.removeEventListener("touchend", onEnd);
      card.removeEventListener("click", onClick, true);
    };
  }, [n]);

  const arrow =
    "absolute top-1/2 z-[2] grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-card/90 text-ink opacity-0 shadow-card transition-[opacity,background-color,color] hover:bg-primary-solid hover:text-white focus-visible:opacity-100 group-hover:opacity-100";

  return (
    <div ref={ref} className="absolute inset-0">
      {images.map((im, k) => (
        <div key={im.id} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-500 ${k === i ? "opacity-100" : "opacity-0"}`}>
          <Media img={im.src} alt={alt} sizes={sizes} />
        </div>
      ))}
      <button type="button" onClick={() => go(i - 1)} aria-label={t.prevImg} className={`${arrow} left-2`}>
        <Icon name="chevL" size={18} />
      </button>
      <button type="button" onClick={() => go(i + 1)} aria-label={t.nextImg} className={`${arrow} right-2`}>
        <Icon name="chevR" size={18} />
      </button>
      <span className="absolute inset-x-0 bottom-2 z-[2] flex justify-center gap-1.5">
        {images.map((im, k) => (
          <button
            key={im.id}
            type="button"
            onClick={() => setI(k)}
            aria-label={`${t.showImg} ${k + 1}`}
            aria-current={k === i}
            className={`h-2 cursor-pointer rounded-full border-0 p-0 shadow-[0_0_0_1px_rgba(0,0,0,.15)] transition-[width,background-color] ${k === i ? "w-5 bg-white" : "w-2 bg-white/60"}`}
          />
        ))}
      </span>
    </div>
  );
}
