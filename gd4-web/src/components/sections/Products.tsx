import { Suspense } from "react";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { getCategories, getProducts } from "@/lib/content";
import { gridCols } from "@/lib/grid";
import type { Locale, ProductsSection } from "@/types/site";
import { Catalog } from "./Catalog";
import { ProductCard } from "./ProductCard";
import { H2 } from "./shared";

export async function Products({ s, lang }: { s: ProductsSection; lang: Locale }) {
  const t = getDict(lang);
  const categories = await getCategories();

  if (s.catalog) {
    const products = await getProducts();
    // การอ่านคำค้นและหมวดจากลิงก์ต้องครอบด้วย Suspense ระหว่างรอจะแสดงสินค้าทั้งหมดไปก่อน
    const catalog = (initial: boolean) => (
      <Catalog heading={tx(s.heading, lang)} products={products} categories={categories} serverRender={initial} />
    );
    return <Suspense fallback={catalog(true)}>{catalog(false)}</Suspense>;
  }

  const products = await getProducts({ category: s.category, limit: s.count || 4 });
  const catName = (id: string) => tx(categories.find((c) => c.id === id)?.name, lang);
  const sub = tx(s.sub, lang);

  return (
    <div className="sec flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <H2>{tx(s.heading, lang)}</H2>
        {sub && <p className="m-0 text-body text-ink2">{sub}</p>}
      </div>
      <div className={`grid gap-[18px] ${gridCols(Math.max(products.length, 1))} min-[360px]:max-sm:grid-cols-2`}>
        {products.map((p, i) => (
          <ProductCard key={p.id} p={p} cat={catName(p.category)} lang={lang} t={t} i={i} />
        ))}
      </div>
    </div>
  );
}
