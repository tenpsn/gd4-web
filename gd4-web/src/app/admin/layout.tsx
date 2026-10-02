import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Thai } from "next/font/google";
import { AdminLangProvider } from "@/admin/context";
import { getAdminLang } from "@/admin/server";
import { ThemeSync } from "@/components/layout/theme";
import { ADMIN_THEME_KEY, themeInitScript } from "@/components/layout/theme-init";
import "./admin.css";

const plexThai = IBM_Plex_Sans_Thai({ weight: ["400", "500", "600", "700"], subsets: ["thai", "latin"], variable: "--font-plex-thai", display: "swap" });
const plex = IBM_Plex_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plex", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "GD4 Medical Admin", template: "%s · GD4 Admin" },
  robots: { index: false, follow: false },
};

/** โครงหน้าหลักของหลังบ้าน แยกสี ภาษา และธีมเป็นของตัวเอง และไม่มีหัวกับท้ายเว็บ */
export default async function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  const lang = await getAdminLang();
  return (
    <html lang={lang} suppressHydrationWarning className={`${plexThai.variable} ${plex.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript(ADMIN_THEME_KEY) }} />
      </head>
      <body>
        <ThemeSync storageKey={ADMIN_THEME_KEY} />
        <AdminLangProvider lang={lang}>{children}</AdminLangProvider>
      </body>
    </html>
  );
}
