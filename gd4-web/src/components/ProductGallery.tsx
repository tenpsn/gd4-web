"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Media } from "@/components/Media";
import { useI18n } from "@/i18n/client";
import type { Img } from "@/types/site";

export type GalleryImage = { id: string; src: Img; alt: string };

/**
 * รูปสินค้าในหน้ารายละเอียด หน้าตาและการใช้งานเหมือนรูปในการ์ดสินค้า ถ้ามีหลายรูป
 * เลื่อนได้ด้วยลูกศรที่ขึ้นตอนชี้เมาส์ การปัดบนมือถือ ปุ่มลูกศรบนแป้นพิมพ์ จุดบนรูป และรูปย่อด้านล่าง
 * ถ้ามีรูปเดียวจะแสดงรูปนั้นอย่างเดียว
 */
export function ProductGallery({ images, start = 0, noImg }: { images: GalleryImage[]; start?: number; noImg: string }) {
  const { t } = useI18n();
  const [i, setI] = useState(Math.min(Math.max(start, 0), Math.max(images.length - 1, 0)));
  const touchX = useRef<number | null>(null);
  const many = images.length > 1;
  const go = (n: number) => setI((n + images.length) % images.length);

  const frame = "relative aspect-[4/3] overflow-hidden rounded-img border border-line bg-bg2";
  if (!images.length) {
    return (
      <div className={frame}>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink3">
          <Icon name="noimg" size={28} />
          <span className="text-sm">{noImg}</span>
        </span>
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 z-[2] grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-card/90 text-ink opacity-0 shadow-card transition-[opacity,background-color,color] hover:bg-primary-solid hover:text-white focus-visible:opacity-100 group-hover:opacity-100";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className={`group ${frame}`}
        role={many ? "region" : undefined}
        aria-roledescription={many ? "carousel" : undefined}
        aria-label={many ? t.gallery : undefined}
        tabIndex={many ? 0 : undefined}
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowLeft") go(i - 1);
          if (e.key === "ArrowRight") go(i + 1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (!many || touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          // ปัดเกิน 40 พิกเซลถือว่าตั้งใจเลื่อนรูป
          if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
        }}
      >
        {images.map((im, k) => (
          <div
            key={im.id}
            aria-hidden={k !== i}
            className={`absolute inset-0 transition-opacity duration-500 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <Media img={im.src} alt={im.alt} priority={k === start} />
          </div>
        ))}
        {many && (
          <>
            <button type="button" onClick={() => go(i - 1)} aria-label={t.prevImg} className={`${arrow} left-3`}>
              <Icon name="chevL" />
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label={t.nextImg} className={`${arrow} right-3`}>
              <Icon name="chevR" />
            </button>
            <span className="absolute inset-x-0 bottom-3 z-[2] flex justify-center gap-1.5">
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
          </>
        )}
      </div>

      {many && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((im, k) => (
            <button
              key={im.id}
              type="button"
              onClick={() => setI(k)}
              aria-label={`${t.showImg} ${k + 1}`}
              aria-current={k === i}
              className={`relative aspect-[4/3] w-[84px] flex-none cursor-pointer overflow-hidden rounded-img border-2 bg-bg2 transition-[border-color,opacity] ${
                k === i ? "border-primary-solid" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Media img={im.src} alt="" label={false} sizes="84px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
