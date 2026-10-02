import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { Media } from "@/components/Media";
import { tx } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionary";
import type { Locale, Product } from "@/types/site";
import { delay } from "./shared";

export const productUrl = (p: Product) => `/products/${p.sku.toLowerCase()}`;

export function ProductCard({ p, cat, lang, t, i }: { p: Product; cat: string; lang: Locale; t: Dict; i: number }) {
  const name = tx(p.name, lang);
  return (
    <article
      style={delay(i)}
      className="anim-up group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-card text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:shadow-card"
    >
      <div className={`relative aspect-[4/3] ${p.img ? "" : "bg-bg2"}`}>
        {p.img ? (
          <Media img={p.img} alt={p.img === "placeholder" ? `${t.p.img} · ${p.sku}` : name} sizes="(min-width: 1024px) 25vw, 50vw" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink3">
            <span className="grid size-[52px] place-items-center rounded-full border-[1.5px] border-dashed border-line">
              <Icon name="noimg" />
            </span>
            <span className="text-[13px]">{t.p.noImg}</span>
            <span className="font-mono text-xs font-semibold text-ph-ink">{p.sku}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-[18px] pb-[18px] pt-4">
        <span className="text-[12.5px] font-semibold uppercase tracking-[.03em] text-primary">{cat}</span>
        <h3 className="clamp-2 m-0 min-h-[3.1em] pb-[.06em] font-head text-[calc(var(--fs-h3)*.92)] font-semibold leading-normal [overflow-wrap:anywhere]">
          {/* ทำให้กดได้ทั้งการ์ด */}
          <LocalLink href={productUrl(p)} className="text-ink after:absolute after:inset-0 hover:text-ink">
            {name}
          </LocalLink>
        </h3>
        <span className="font-mono text-[12.5px] font-medium text-ink3">{p.sku}</span>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2.5 text-[14.5px] font-semibold text-primary" aria-hidden="true">
          {t.detail}
          <Icon name="chevR" />
        </span>
      </div>
    </article>
  );
}
