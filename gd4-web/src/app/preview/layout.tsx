import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Thai } from "next/font/google";
import "../globals.css";

const plexThai = IBM_Plex_Sans_Thai({ weight: ["400", "500", "600", "700"], subsets: ["thai", "latin"], variable: "--font-plex-thai", display: "swap" });
const plex = IBM_Plex_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plex", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["500", "600"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** โครงหน้าหลักของหน้าตัวอย่างสด ที่แสดงใน iframe ของหลังบ้าน */
export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  return (
    <html lang="th" suppressHydrationWarning className={`${plexThai.variable} ${plex.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
