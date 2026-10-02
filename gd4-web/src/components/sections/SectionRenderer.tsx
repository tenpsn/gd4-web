import { tx } from "@/i18n/config";
import type { Locale, Page, Section, SiteSettings } from "@/types/site";
import { Cards, Cta, Gallery, Logos, PageHeader, Stats, Steps, Table, Text, TextImage, Timeline } from "./basic";
import { Contact } from "./Contact";
import { Faq } from "./Faq";
import { Hero } from "./Hero";
import { Products } from "./Products";
import { SectionShell } from "./shared";
import { Video } from "./Video";

function renderSection(s: Section, lang: Locale, page: Page, settings: SiteSettings) {
  const dark = s.bg === "navy";
  switch (s.type) {
    case "hero":
      return <Hero s={s} />;
    case "pageHeader":
      return <PageHeader s={s} lang={lang} dark={dark} crumb={tx(page.title, lang)} />;
    case "text":
      return <Text s={s} lang={lang} dark={dark} />;
    case "textImage":
      return <TextImage s={s} lang={lang} dark={dark} />;
    case "cards":
      return <Cards s={s} lang={lang} dark={dark} />;
    case "stats":
      return <Stats s={s} lang={lang} dark={dark} />;
    case "products":
      return <Products s={s} lang={lang} />;
    case "logos":
      return <Logos s={s} lang={lang} dark={dark} />;
    case "timeline":
      return <Timeline s={s} lang={lang} dark={dark} />;
    case "gallery":
      return <Gallery s={s} lang={lang} dark={dark} />;
    case "video":
      return <Video s={s} dark={dark} />;
    case "table":
      return <Table s={s} lang={lang} dark={dark} />;
    case "cta":
      return <Cta s={s} lang={lang} dark={dark} />;
    case "faq":
      return <Faq s={s} />;
    case "steps":
      return <Steps s={s} lang={lang} dark={dark} />;
    case "contact":
      return <Contact s={s} lang={lang} settings={settings} />;
  }
}

export function Sections({ page, lang, settings, preview }: { page: Page; lang: Locale; settings: SiteSettings; preview?: boolean }) {
  return page.sections.map((s) => (
    <SectionShell key={s.id} bg={s.bg} anchor={s.anchor} previewId={preview ? s.id : undefined}>
      {renderSection(s, lang, page, settings)}
    </SectionShell>
  ));
}
