/**
 * หน้ารายละเอียดสินค้า ซึ่งไม่มีในไฟล์ดีไซน์ จึงใช้รูปแบบส่วนต่างๆ ที่มีอยู่แล้วแทน
 * หน้านี้ยังต้องให้ทีมดีไซน์ตรวจอีกครั้ง
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { ProductGallery, type GalleryImage } from "@/components/ProductGallery";
import { btn } from "@/components/sections/shared";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { getCategories, getProduct, getProducts } from "@/lib/content";
import { alternates, currentLang } from "@/lib/page";
import type { Img } from "@/types/site";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ sku: p.sku.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[sku]">): Promise<Metadata> {
  const lang = await currentLang();
  const p = await getProduct((await params).sku);
  if (!p) return {};
  return {
    title: tx(p.name, lang),
    description: tx(p.short, lang) || `${tx(p.name, lang)} (${p.sku})`,
    alternates: alternates(`/products/${p.sku.toLowerCase()}`, lang),
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[sku]">) {
  const lang = await currentLang();
  const t = getDict(lang);
  const p = await getProduct((await params).sku);
  if (!p) notFound();
  const cat = (await getCategories()).find((c) => c.id === p.category);
  const name = tx(p.name, lang);
  // รูปทั้งหมดของสินค้าที่มีไฟล์แล้ว ถ้าข้อมูลเก่ายังไม่มีรายการรูป ใช้รูปหลักรูปเดียว
  const alt = (src: Img, label?: string) => (src === "placeholder" ? `${t.p.img} · ${p.sku}` : label || name);
  const gallery: GalleryImage[] = (p.images ?? []).filter((im) => im.src).map((im) => ({ id: im.id, src: im.src, alt: alt(im.src, tx(im.label, lang)) }));
  if (!gallery.length && p.img) gallery.push({ id: "main", src: p.img, alt: alt(p.img) });
  const short = tx(p.short, lang);
  const detail = tx(p.detail, lang);

  return (
    <>
      <section className="bg-panel text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3.5 px-[var(--sec-px)] py-[calc(var(--sec-py)*.6)]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-small text-on-dark">
            <LocalLink href="/" className="text-on-dark hover:text-white">
              {t.home}
            </LocalLink>
            <Icon name="chevR" />
            <LocalLink href="/products" className="text-on-dark hover:text-white">
              {t.p.products}
            </LocalLink>
            <Icon name="chevR" />
            <span className="text-white" aria-current="page">
              {p.sku}
            </span>
          </nav>
        </div>
      </section>

      <section className="bg-bg">
        <div className="sec grid grid-cols-1 items-start gap-[clamp(28px,5vw,56px)] lg:grid-cols-2">
          <ProductGallery images={gallery} start={Math.max(0, gallery.findIndex((g) => g.src === p.img))} noImg={t.p.noImg} />

          <div className="flex min-w-0 flex-col gap-4">
            {cat && (
              <LocalLink href={`/products?cat=${cat.id}`} className="w-fit text-[13px] font-semibold uppercase tracking-[.03em] text-primary">
                {tx(cat.name, lang)}
              </LocalLink>
            )}
            <h1 className="m-0 font-head text-h1 font-bold leading-[1.25] text-balance [overflow-wrap:anywhere]">{name}</h1>
            <span className="font-mono text-sm font-medium text-ink3">
              {t.p.sku}: {p.sku}
            </span>
            {short && <p className="m-0 text-body leading-[1.85] text-ink2">{short}</p>}
            {detail && (
              // ล้างโค้ดอันตรายออกแล้วตอนบันทึกในหลังบ้าน
              <div className="rich text-body leading-[1.8]" dangerouslySetInnerHTML={{ __html: detail }} />
            )}

            <div className="flex flex-col gap-3">
              <h2 className="m-0 font-head text-h3 font-semibold">{t.p.specs}</h2>
              {p.specs?.some((sp) => tx(sp.k, lang)) ? (
                <dl className="m-0 overflow-hidden rounded-card border border-line bg-card">
                  {p.specs.filter((sp) => tx(sp.k, lang)).map((sp, i) => (
                    <div key={i} className="grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] gap-3 border-t border-line px-4 py-3 first:border-t-0">
                      <dt className="text-ink2">{tx(sp.k, lang)}</dt>
                      <dd className="m-0 font-medium">{sp.v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="m-0 rounded-card border border-dashed border-line px-4 py-3.5 text-[15px] text-ink2">{t.p.noSpecs}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <LocalLink href="/contact" className={btn.accent}>
                {t.quote}
              </LocalLink>
              {p.pdf && (
                <a href={p.pdf.src} download={p.pdf.name} className={btn.outline}>
                  {t.p.catalog}
                </a>
              )}
              <LocalLink href="/products" className={btn.outline}>
                {t.p.back}
              </LocalLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
