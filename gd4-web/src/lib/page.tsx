import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { Sections } from "@/components/sections/SectionRenderer";
import { href, isLocale, LOCALES, tx } from "@/i18n/config";
import type { Locale } from "@/types/site";
import { getPage, getSettings } from "./content";

export async function currentLang(): Promise<Locale> {
  const l = await rootLang();
  if (!isLocale(l)) notFound();
  return l;
}

/** ลิงก์หลักและลิงก์ภาษาอื่นของหน้า เพื่อให้เครื่องมือค้นหารู้จัก */
export function alternates(path: string, lang: Locale): Metadata["alternates"] {
  return {
    canonical: href(path, lang),
    languages: { ...Object.fromEntries(LOCALES.map((l) => [l, href(path, l)])), "x-default": path },
  };
}

/** ส่วนประกอบที่ใช้ร่วมกันของหน้าที่แก้ไขได้จากแอดมิน */
export function cmsPage(id: string) {
  async function generateMetadata(): Promise<Metadata> {
    const lang = await currentLang();
    const page = await getPage(id);
    if (!page) return {};
    const settings = await getSettings();
    const header = page.sections.find((s) => s.type === "pageHeader");
    const description =
      tx(page.seo?.description, lang) || (header ? tx(header.sub, lang) : "") || tx(settings.seo.description, lang);
    return {
      // หน้าแรกใช้ชื่อเว็บหลัก
      ...(page.slug === "/" ? {} : { title: tx(page.seo?.title, lang) || tx(page.title, lang) }),
      description,
      alternates: alternates(page.slug, lang),
      ...(page.seo?.image && page.seo.image !== "placeholder" ? { openGraph: { images: [page.seo.image] } } : {}),
    };
  }

  async function Page() {
    const lang = await currentLang();
    const [page, settings] = await Promise.all([getPage(id), getSettings()]);
    if (!page) notFound();
    return <Sections page={page} lang={lang} settings={settings} />;
  }

  return { generateMetadata, Page };
}
