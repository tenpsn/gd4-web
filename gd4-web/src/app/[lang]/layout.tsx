import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeSync } from "@/components/layout/theme";
import { THEME_INIT } from "@/components/layout/theme-init";
import { LangProvider } from "@/i18n/client";
import { isLocale, LOCALES, tx } from "@/i18n/config";
import { getDesign, getSettings } from "@/lib/content";
import { designCss, googleFontsHref } from "@/lib/designCss";
import "../globals.css";

const plexThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-plex-thai",
  display: "swap",
});
const plex = IBM_Plex_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plex", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["500", "600"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b111b" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = await rootLang();
  if (!isLocale(lang)) return {};
  const s = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: tx(s.seo.title, lang), template: `%s · ${tx(s.siteName, lang)}` },
    description: tx(s.seo.description, lang),
    openGraph: { siteName: tx(s.siteName, lang), locale: lang === "th" ? "th_TH" : "en_US", type: "website", ...(s.seo.image && s.seo.image !== "placeholder" ? { images: [s.seo.image] } : {}) },
    ...(s.favicon && s.favicon !== "placeholder" ? { icons: { icon: s.favicon } } : {}),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const [settings, design] = await Promise.all([getSettings(), getDesign()]);
  const css = designCss(design);
  const fonts = googleFontsHref(design);

  return (
    <html lang={lang} suppressHydrationWarning className={`${plexThai.variable} ${plex.variable} ${plexMono.variable}`}>
      <head>
        {/* ตั้งธีมก่อนหน้าเว็บแสดงผล เพื่อไม่ให้โหมดมืดกะพริบ */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {/* ธีมและตัวอักษรจากหลังบ้าน ใส่เฉพาะค่าที่ต่างจากค่าเริ่มต้น */}
        {fonts && <link rel="stylesheet" href={fonts} />}
        {css && <style id="design-tokens" dangerouslySetInnerHTML={{ __html: css }} />}
      </head>
      <body>
        <ThemeSync />
        <LangProvider lang={lang}>
          <Header menu={settings.menu} siteName={tx(settings.siteName, lang)} logo={settings.logo} logoDark={settings.logoDark} />
          <main id="main">{children}</main>
          <Footer settings={settings} lang={lang} />
        </LangProvider>
      </body>
    </html>
  );
}
