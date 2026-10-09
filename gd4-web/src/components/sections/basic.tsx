import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { Media } from "@/components/Media";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { gridCols, gridMax } from "@/lib/grid";
import type {
  CardsSection,
  CtaSection,
  GallerySection,
  Locale,
  LogosSection,
  PageHeaderSection,
  StatsSection,
  StepsSection,
  TableSection,
  TextImageSection,
  TextSection,
  TimelineSection,
} from "@/types/site";
import { CountUp } from "./CountUp";
import { btn, delay, H2, ink2 } from "./shared";

type P<S> = { s: S; lang: Locale; dark: boolean };

export function PageHeader({ s, lang, crumb }: P<PageHeaderSection> & { crumb: string }) {
  const t = getDict(lang);
  return (
    <div className="relative mx-auto flex max-w-[1200px] flex-col gap-3.5 px-[var(--sec-px)] py-[calc(var(--sec-py)*.7)]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-small text-on-dark">
        <LocalLink href="/" className="text-on-dark hover:text-white">
          {t.home}
        </LocalLink>
        <Icon name="chevR" />
        <span className="text-white" aria-current="page">
          {crumb}
        </span>
      </nav>
      <h1 className="m-0 max-w-[820px] font-head text-h1 font-bold leading-[1.25] text-balance">{tx(s.heading, lang)}</h1>
      {tx(s.sub, lang) && <p className="m-0 max-w-[720px] text-body text-pretty text-on-dark">{tx(s.sub, lang)}</p>}
      <span className="h-1 w-14 rounded-sm bg-accent-solid" />
    </div>
  );
}

export function Text({ s, lang, dark }: P<TextSection>) {
  return (
    <div className="sec">
      <div className="flex max-w-[780px] flex-col gap-4">
        <H2>{tx(s.heading, lang)}</H2>
        <p className={`m-0 text-body leading-[1.85] text-pretty ${ink2(dark)}`}>{tx(s.body, lang)}</p>
      </div>
    </div>
  );
}

export function TextImage({ s, lang, dark }: P<TextImageSection>) {
  const label = tx(s.btnLabel, lang);
  return (
    <div className="sec grid grid-cols-1 items-center gap-[clamp(28px,5vw,64px)] lg:grid-cols-2">
      <div className="order-1 flex min-w-0 flex-col gap-[18px]">
        <H2>{tx(s.heading, lang)}</H2>
        <p className={`m-0 text-body leading-[1.85] text-pretty ${ink2(dark)}`}>{tx(s.body, lang)}</p>
        {label && s.btnUrl && (
          <LocalLink href={s.btnUrl} className={btn.primary}>
            {label}
            <Icon name="arrowR" />
          </LocalLink>
        )}
      </div>
      <div className={`relative aspect-[4/3] overflow-hidden rounded-img ${s.imgSide === "right" ? "order-0 lg:order-2" : "order-0"}`}>
        <Media img={s.img} alt={tx(s.heading, lang)} />
      </div>
    </div>
  );
}

export function Cards({ s, lang, dark }: P<CardsSection>) {
  const sub = tx(s.sub, lang);
  return (
    <div className="sec flex flex-col gap-9">
      <div className="flex max-w-[720px] flex-col gap-2.5">
        <H2>{tx(s.heading, lang)}</H2>
        {sub && <p className={`m-0 text-body ${ink2(dark)}`}>{sub}</p>}
      </div>
      <div className={`grid w-full gap-[18px] ${gridCols(s.items.length, { cols: s.cols })} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => (
          <article
            key={c.id}
            style={delay(i)}
            className="anim-up flex h-full min-w-0 flex-col gap-3.5 rounded-card border border-line bg-card p-[26px] text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:shadow-card"
          >
            <span className="grid size-12 flex-none place-items-center rounded-xl bg-soft text-primary">
              <Icon name={c.icon} size={22} />
            </span>
            <h3 className="clamp-2 m-0 pb-[.06em] font-head text-h3 font-semibold leading-normal [overflow-wrap:anywhere]">
              {tx(c.title, lang)}
            </h3>
            <p className="clamp-4 m-0 text-[calc(var(--fs-body)*.92)] leading-[1.7] text-ink2">{tx(c.desc, lang)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Stats({ s, lang }: P<StatsSection>) {
  return (
    <div className="sec flex flex-col items-center gap-9">
      <H2 className="text-center">{tx(s.heading, lang)}</H2>
      <div className={`grid w-full gap-4 ${gridCols(s.items.length, { m: 2 })} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => (
          <div
            key={c.id}
            style={delay(i)}
            className="anim-up flex h-full flex-col items-center justify-center gap-1.5 rounded-card bg-card px-3.5 py-6 text-center"
          >
            <span className="whitespace-nowrap font-head text-[calc(var(--fs-h2)*1.35)] font-bold leading-[1.1] text-primary tabular-nums">
              <CountUp value={tx(c.value, lang)} />
            </span>
            <span className="text-small leading-normal text-balance text-ink2">{tx(c.label, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Logos({ s, lang }: P<LogosSection>) {
  const marquee = s.items.length >= 6;
  const box = "grid h-20 place-items-center rounded-card border border-line bg-card px-4 text-center text-[17px] font-bold text-ink2";
  // มีแค่รูปหรือแค่ชื่อ แสดงไว้ตรงกลาง ถ้ามีทั้งสองอย่าง วางรูปไว้หน้าชื่อ
  const logo = (x: LogosSection["items"][number]) => {
    const img = x.logo && x.logo !== "placeholder" ? x.logo : null;
    const name = x.name.trim();
    if (!img) return name;
    return (
      <span className="flex min-w-0 max-w-full items-center justify-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- โลโก้แต่ละอันขนาดไม่เท่ากัน ต้องคงสัดส่วนเดิมของรูป */}
        <img src={img} alt={name ? "" : x.name} className={`${name ? "max-h-10 max-w-[45%]" : "max-h-12 max-w-full"} flex-none object-contain`} />
        {name && <span className="clamp-2 min-w-0 text-left leading-tight [overflow-wrap:anywhere]">{name}</span>}
      </span>
    );
  };
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-7 px-[var(--sec-px)] py-[calc(var(--sec-py)*.75)]">
      <H2 className="text-center text-[calc(var(--fs-h2)*.8)]">{tx(s.heading, lang)}</H2>
      {marquee ? (
        <div className="group w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max gap-3.5 [animation:s-marq_32s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[...s.items, ...s.items].map((x, i) => (
              <span key={`${x.id}-${i}`} aria-hidden={i >= s.items.length} className={`w-[190px] flex-none ${box}`}>
                {logo(x)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-wrap justify-center gap-3.5">
          {s.items.map((x) => (
            <span key={x.id} className={`flex-[0_1_200px] ${box}`}>
              {logo(x)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Timeline({ s, lang }: P<TimelineSection>) {
  const dot = "absolute size-3.5 rounded-full bg-accent-solid shadow-[0_0_0_4px_var(--c-bg2)]";
  return (
    <div className="sec flex flex-col gap-9">
      <H2>{tx(s.heading, lang)}</H2>
      {/* แท็บเล็ตและคอมพิวเตอร์ แสดงเป็นแนวนอน */}
      <ol className={`m-0 hidden list-none gap-x-5 gap-y-7 p-0 sm:grid ${gridCols(s.items.length)}`}>
        {s.items.map((c, i) => (
          <li key={c.id} style={delay(i)} className="anim-up relative flex flex-col gap-2 border-t-2 border-line pt-[22px]">
            <span className={`${dot} -top-2 left-0`} />
            <span className="font-mono text-[calc(var(--fs-h3)*1.2)] font-semibold text-primary">{c.year}</span>
            <span className="text-[calc(var(--fs-body)*.94)] leading-[1.6] text-ink2">{tx(c.event, lang)}</span>
          </li>
        ))}
      </ol>
      {/* มือถือ แสดงเป็นแนวตั้ง */}
      <ol className="m-0 ml-[7px] flex list-none flex-col border-l-2 border-line p-0 sm:hidden">
        {s.items.map((c, i) => (
          <li key={c.id} style={delay(i)} className="anim-up relative flex flex-col gap-1 pb-[26px] pl-6">
            <span className={`${dot} -left-2 top-1.5`} />
            <span className="font-mono text-lg font-semibold text-primary">{c.year}</span>
            <span className="text-body text-ink2">{tx(c.event, lang)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Gallery({ s, lang }: P<GallerySection>) {
  return (
    <div className="sec flex flex-col gap-8">
      <H2>{tx(s.heading, lang)}</H2>
      <div className={`grid gap-4 ${gridCols(s.items.length)} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => (
          <figure key={c.id} style={delay(i)} className="anim-up m-0 flex min-w-0 flex-col gap-2.5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-img transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] hover:scale-[1.02]">
              <Media img={c.img} alt={tx(c.caption, lang)} label={false} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            </div>
            <figcaption className="clamp-2 text-small leading-normal text-ink2">{tx(c.caption, lang)}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function Table({ s, lang }: P<TableSection>) {
  return (
    <div className="sec flex flex-col gap-7">
      <H2>{tx(s.heading, lang)}</H2>
      <table className="hidden w-full border-separate border-spacing-0 overflow-hidden rounded-card border border-line bg-card text-body sm:table">
        <thead>
          <tr className="bg-primary-solid text-left text-white">
            <th scope="col" className="w-[34%] px-5 py-3.5 font-semibold">
              {tx(s.h1, lang)}
            </th>
            <th scope="col" className="px-5 py-3.5 font-semibold">
              {tx(s.h2, lang)}
            </th>
          </tr>
        </thead>
        <tbody>
          {s.items.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="border-t border-line px-5 py-3.5 text-left align-top font-semibold">
                {tx(r.c1, lang)}
              </th>
              <td className="border-t border-line px-5 py-3.5 text-ink2">{tx(r.c2, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="m-0 flex flex-col gap-2.5 sm:hidden">
        {s.items.map((r) => (
          <div key={r.id} className="flex flex-col gap-1 rounded-card border border-line bg-card px-4 py-3.5">
            <dt className="text-[15px] font-bold">{tx(r.c1, lang)}</dt>
            <dd className="m-0 text-[14.5px] text-ink2">{tx(r.c2, lang)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Cta({ s, lang, dark }: P<CtaSection>) {
  const b1 = tx(s.btnLabel, lang);
  const b2 = tx(s.btn2Label, lang);
  return (
    <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-7 px-[var(--sec-px)] py-[calc(var(--sec-py)*.8)] lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex flex-col gap-2.5 border-l-[5px] border-accent-solid pl-[22px]">
        <H2>{tx(s.heading, lang)}</H2>
        <p className={`m-0 text-body ${ink2(dark)}`}>{tx(s.sub, lang)}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {b1 && s.btnUrl && (
          <LocalLink href={s.btnUrl} className={`${btn.accent} px-6 py-[15px]`}>
            {b1}
          </LocalLink>
        )}
        {b2 && s.btn2Url && (
          <LocalLink href={s.btn2Url} className={dark ? btn.outlineLight : btn.outline}>
            {b2}
          </LocalLink>
        )}
      </div>
    </div>
  );
}

export function Steps({ s, lang }: P<StepsSection>) {
  return (
    <div className="sec flex flex-col gap-9">
      <H2>{tx(s.heading, lang)}</H2>
      <ol className={`m-0 grid list-none gap-[18px] p-0 ${gridCols(s.items.length)} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => (
          <li
            key={c.id}
            style={delay(i)}
            className="anim-up relative flex h-full min-w-0 flex-col gap-3 rounded-card border border-line bg-card p-6 text-ink"
          >
            <span className="grid size-11 place-items-center rounded-full bg-primary-solid font-mono text-[15px] font-semibold text-white">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="m-0 font-head text-h3 font-semibold leading-[1.4] [overflow-wrap:anywhere]">{tx(c.title, lang)}</h3>
            <p className="m-0 text-[calc(var(--fs-body)*.92)] leading-[1.65] text-ink2">{tx(c.desc, lang)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
