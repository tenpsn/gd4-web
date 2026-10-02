"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Category, Product } from "@/types/site";
import { ProductCard } from "./ProductCard";
import { btn, H2 } from "./shared";

const TRY = ["PM-12", "AED-7", "UX-80"];

/** อัปเดตหมวดและคำค้นในลิงก์ของหน้า โดยไม่ต้องโหลดหน้าใหม่ */
function syncUrl(cat: string, q: string) {
  const sp = new URLSearchParams(window.location.search);
  if (cat !== "all") sp.set("cat", cat);
  else sp.delete("cat");
  if (q) sp.set("q", q);
  else sp.delete("q");
  const qs = sp.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

export function Catalog(props: { heading: string; products: Product[]; categories: Category[]; serverRender?: boolean }) {
  if (props.serverRender) return <CatalogView {...props} initialCat="all" initialQ="" />;
  return <CatalogWithParams {...props} />;
}

function CatalogWithParams(props: { heading: string; products: Product[]; categories: Category[] }) {
  const sp = useSearchParams();
  const cat = sp.get("cat") ?? "all";
  const q = sp.get("q") ?? "";
  // เริ่มรายการใหม่เมื่อเปลี่ยนหมวด แต่ไม่เริ่มใหม่ตอนพิมพ์คำค้น
  // เพื่อไม่ให้ช่องค้นหาหลุดระหว่างพิมพ์
  return <CatalogView key={cat} {...props} initialCat={cat} initialQ={q} />;
}

function CatalogView({ heading, products, categories, initialCat, initialQ }: {
  heading: string;
  products: Product[];
  categories: Category[];
  initialCat: string;
  initialQ: string;
}) {
  const { lang, t } = useI18n();
  const [cat, setCat] = useState(categories.some((c) => c.id === initialCat) ? initialCat : "all");
  const [q, setQ] = useState(initialQ);

  const update = (nextCat: string, nextQ: string) => {
    setCat(nextCat);
    setQ(nextQ);
    syncUrl(nextCat, nextQ.trim());
  };

  const term = q.trim().toLowerCase();
  const list = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!term || p.sku.toLowerCase().includes(term) || p.name.th.toLowerCase().includes(term) || p.name.en.toLowerCase().includes(term)),
  );
  const catName = (id: string) => tx(categories.find((c) => c.id === id)?.name, lang);
  const chips: [string, string][] = [["all", t.p.all], ...categories.map((c): [string, string] => [c.id, tx(c.name, lang)])];

  return (
    <div className="sec flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <H2>{heading}</H2>
        <span className="text-small text-ink2" aria-live="polite">
          {list.length} {t.p.count}
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        <label className="relative block max-w-[560px]">
          <span className="sr-only">{t.p.search}</span>
          <span className="pointer-events-none absolute left-3.5 top-1/2 grid -translate-y-1/2 text-ink3">
            <Icon name="search" />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => update(cat, e.target.value)}
            placeholder={t.p.search}
            className="min-h-[50px] w-full rounded-ctl border border-line bg-card pl-11 pr-4 text-body text-ink outline-none focus:border-primary-solid focus:shadow-[0_0_0_3px_var(--c-soft)]"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t.p.category}>
          {chips.map(([id, label]) => {
            const on = cat === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => update(id, q)}
                className={`min-h-10 flex-none cursor-pointer whitespace-nowrap rounded-full border px-4 text-[14.5px] font-medium transition-colors duration-[250ms] ${
                  on ? "border-primary-solid bg-primary-solid text-white" : "border-line bg-card text-ink2"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-[18px] min-[360px]:grid-cols-2 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} p={p} cat={catName(p.category)} lang={lang} t={t} i={i} />
          ))}
        </div>
      ) : term ? (
        <Empty icon="search" title={`${t.p.noResT} “${q.trim()}”`} desc={t.p.noResD}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-ink3">{t.p.try}</span>
            {TRY.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => update("all", x)}
                className="min-h-9 cursor-pointer rounded-full border border-line bg-card px-3 font-mono text-[13px] font-semibold text-ink hover:border-primary-solid hover:text-primary"
              >
                {x}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => update("all", "")}
            className="min-h-11 cursor-pointer rounded-ctl border border-line bg-transparent px-[18px] text-btn font-semibold text-ink"
          >
            {t.p.clear}
          </button>
        </Empty>
      ) : (
        <Empty icon="box" title={t.p.emptyT} desc={t.p.emptyD}>
          <LocalLink href="/contact" className={btn.primary}>
            {t.p.askSales}
          </LocalLink>
        </Empty>
      )}
    </div>
  );
}

function Empty({ icon, title, desc, children }: { icon: "search" | "box"; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="anim-up flex flex-col items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-line px-5 py-14 text-center">
      <span className="grid size-[72px] place-items-center rounded-[20px] bg-soft text-primary">
        <Icon name={icon} />
      </span>
      <h3 className="m-0 font-head text-h3 font-semibold [overflow-wrap:anywhere]">{title}</h3>
      <p className="m-0 max-w-[480px] text-[calc(var(--fs-body)*.94)] text-ink2">{desc}</p>
      {children}
    </div>
  );
}
