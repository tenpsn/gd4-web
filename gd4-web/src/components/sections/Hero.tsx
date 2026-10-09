"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { Media } from "@/components/Media";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { HeroSection } from "@/types/site";
import { btn } from "./shared";

export function Hero({ s }: { s: HeroSection }) {
  const { lang, t } = useI18n();
  const slides = s.items;
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // เลื่อนสไลด์อัตโนมัติ แต่หยุดเมื่อไม่ได้เปิดหน้านี้อยู่ ผู้ใช้ชี้เมาส์ค้างไว้
  // หรือผู้ใช้ตั้งเครื่องให้ลดภาพเคลื่อนไหว
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % count);
    }, Math.max(3, s.autoplay) * 1000);
    return () => window.clearInterval(timer);
  }, [count, paused, s.autoplay]);

  if (!count) return null;
  const cur = slides[active];
  const go = (i: number) => setActive((i + count) % count);

  return (
    <div
      className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex min-w-0 flex-col justify-center gap-6 px-[var(--sec-px)] py-[var(--sec-py)]">
        <div className="grid" aria-live={paused ? "polite" : "off"}>
          {slides.map((sl, i) => {
            const on = i === active;
            // เฉพาะสไลด์ที่แสดงอยู่เท่านั้นที่เป็นหัวข้อหลักของหน้า
            const Title = on ? "h1" : "p";
            return (
              <div
                key={sl.id}
                aria-hidden={!on}
                className={`[grid-area:1/1] flex flex-col gap-[18px] transition-[opacity,transform,visibility] duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
                  on ? "visible opacity-100" : "invisible translate-y-2.5 opacity-0"
                }`}
              >
                <span className="h-1 w-11 rounded-sm bg-accent-solid" />
                <Title className="clamp-3 m-0 pb-[.08em] font-head text-h1 font-bold leading-[1.4] text-white text-balance [overflow-wrap:anywhere]">
                  {tx(sl.title, lang)}
                </Title>
                <p className="clamp-3 m-0 max-w-[560px] text-[calc(var(--fs-body)*1.06)] text-pretty text-on-dark">{tx(sl.sub, lang)}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <LocalLink href={cur.btnUrl || "/products"} className={btn.accent}>
            {tx(cur.btnLabel, lang) || t.viewAll}
            <Icon name="arrowR" />
          </LocalLink>
          <LocalLink href="/contact" className={btn.outlineLight}>
            {t.quote}
          </LocalLink>
        </div>

        {count > 1 && (
          <div className="flex flex-wrap items-center gap-3.5">
            <button type="button" onClick={() => go(active - 1)} aria-label={t.prev} className={ctrl}>
              <Icon name="chevL" />
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {slides.map((sl, i) => (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${t.slide} ${i + 1}`}
                  aria-current={i === active}
                  className="h-2 cursor-pointer rounded border-0 p-0 transition-[width,background-color] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)]"
                  style={{ width: i === active ? 28 : 8, background: i === active ? "var(--c-accent-solid)" : "rgba(255,255,255,.45)" }}
                />
              ))}
            </div>
            <button type="button" onClick={() => go(active + 1)} aria-label={t.next} className={ctrl}>
              <Icon name="chevR" />
            </button>
            <span className="font-mono text-[13px] font-semibold text-on-dark">
              {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      <div className="relative grid min-h-[220px] sm:min-h-[300px] lg:min-h-0">
        {slides.map((sl, i) => (
          <div
            key={sl.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
            aria-hidden={i !== active}
          >
            <Media img={sl.img} alt={tx(sl.title, lang)} dark priority={i === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

const ctrl =
  "grid size-10 cursor-pointer place-items-center rounded-full border border-white/35 bg-transparent text-white hover:bg-white/10";
