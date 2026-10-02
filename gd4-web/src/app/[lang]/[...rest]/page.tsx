import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sections } from "@/components/sections/SectionRenderer";
import { tx } from "@/i18n/config";
import { getPageBySlug, getSettings } from "@/lib/content";
import { alternates, currentLang } from "@/lib/page";

/** แสดงหน้าที่แอดมินเพิ่มไว้ ถ้าไม่พบหน้าจะขึ้นว่าไม่พบหน้า 404 */
async function load(params: Promise<{ rest: string[] }>) {
  const slug = `/${(await params).rest.join("/")}`;
  return getPageBySlug(slug);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[...rest]">): Promise<Metadata> {
  const lang = await currentLang();
  const page = await load(params);
  if (!page) return {};
  return {
    title: tx(page.seo?.title, lang) || tx(page.title, lang),
    ...(tx(page.seo?.description, lang) ? { description: tx(page.seo?.description, lang) } : {}),
    alternates: alternates(page.slug, lang),
  };
}

export default async function CmsPage({ params }: PageProps<"/[lang]/[...rest]">) {
  const lang = await currentLang();
  const [page, settings] = await Promise.all([load(params), getSettings()]);
  if (!page) notFound();
  return <Sections page={page} lang={lang} settings={settings} />;
}
