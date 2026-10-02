/** ค่าเริ่มต้นของสี ตัวอักษร และขนาด ตามแบบดีไซน์ของเว็บไซต์ */
import type { Design } from "@/types/site";

export const DEFAULT_DESIGN: Design = {
  fonts: { heading: "IBM Plex Sans Thai", body: "IBM Plex Sans Thai" },
  customFonts: [],
  sizes: {
    h1: { d: 48, t: 38, m: 30 },
    h2: { d: 34, t: 28, m: 24 },
    h3: { d: 19, t: 18, m: 17 },
    body: { d: 17, t: 16, m: 16 },
    btn: { d: 15.5, t: 15, m: 15 },
    menu: { d: 15, t: 15, m: 16 },
  },
  weight: { heading: 700, body: 400 },
  lh: { heading: 1.3, body: 1.7 },
  ls: { heading: 0, body: 0 },
  colors: {
    light: { primary: "#1a4fa0", accent: "#c8312a", bg: "#ffffff", bg2: "#f4f6f9", heading: "#0f1b2d", text: "#0f1b2d", muted: "#4a5568" },
    dark: { primary: "#2a5fb8", accent: "#d43a2f", bg: "#0b111b", bg2: "#111a2a", heading: "#e8edf5", text: "#e8edf5", muted: "#a7b3c6" },
  },
  radius: 12,
  spacing: 1,
};

/** ฟอนต์ที่ให้เลือกในหน้าแก้ไข เรียงฟอนต์ที่รองรับภาษาไทยไว้ก่อน */
export const FONT_CHOICES = ["IBM Plex Sans Thai", "Prompt", "Noto Sans Thai", "Sarabun", "Kanit", "Anuphan", "Bai Jamjuree", "Mitr", "Inter", "Poppins"];

/** ขนาดต่ำสุดและสูงสุดที่ตั้งได้ของตัวอักษรแต่ละแบบ หน่วยเป็นพิกเซล */
export const SIZE_RANGE = { h1: [20, 72], h2: [18, 56], h3: [14, 32], body: [12, 24], btn: [12, 22], menu: [12, 22] } as const;
