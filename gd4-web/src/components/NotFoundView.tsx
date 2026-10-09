"use client";

import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { btn } from "@/components/sections/shared";
import { href } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

export function NotFoundView() {
  const { lang, t } = useI18n();
  return (
    <section className="bg-bg">
      <div className="mx-auto flex max-w-[760px] flex-col items-center gap-[18px] px-[var(--sec-px)] py-[calc(var(--sec-py)*1.3)] text-center">
        <span aria-hidden="true" className="relative font-head text-[clamp(88px,18vw,160px)] font-bold leading-none tracking-[-.04em] text-primary">
          4<span className="text-accent">0</span>4
        </span>
        <h1 className="m-0 font-head text-h2 font-bold leading-[1.3]">{t.nf.t}</h1>
        <p className="m-0 max-w-[520px] text-ink2">{t.nf.d}</p>
        {/* ฟอร์มค้นหาธรรมดา กดแล้วไปหน้ารายการสินค้าพร้อมคำค้น */}
        <form action={href("/products", lang)} method="get" role="search" className="relative block w-full max-w-[460px]">
          <span className="pointer-events-none absolute left-3.5 top-1/2 grid -translate-y-1/2 text-ink3">
            <Icon name="search" />
          </span>
          <input
            type="search"
            name="q"
            aria-label={t.p.search}
            placeholder={t.p.search}
            className="min-h-[50px] w-full rounded-input border border-line bg-card pl-11 pr-4 text-body text-ink outline-none focus:border-primary-solid"
          />
        </form>
        <div className="flex flex-wrap justify-center gap-3">
          <LocalLink href="/" className={`${btn.primary} py-[13px]`}>
            <Icon name="home" />
            {t.nf.home}
          </LocalLink>
          <LocalLink href="/products" className={btn.outline}>
            {t.viewAll}
          </LocalLink>
        </div>
      </div>
    </section>
  );
}
