/**
 * โครงสร้างข้อมูลของเว็บ แบ่งเป็นหน้า ส่วน และรายการย่อย ข้อความที่แปลได้เก็บเป็น LText ทั้งไทยและอังกฤษ
 * เมื่อระบบหลังบ้านพร้อม โครงสร้างนี้จะกลายเป็นตารางในฐานข้อมูล
 */

export type Locale = "th" | "en";

export type LText = { th: string; en: string };

/**
 * ที่อยู่รูปภาพ เป็น null เมื่อไม่มีรูป หรือเป็น placeholder เพื่อแสดงรูปตัวอย่างไว้ก่อนจนกว่าจะอัปโหลดรูปจริง
 */
export type Img = string | null;

export type IconName =
  | "award"
  | "users"
  | "clock"
  | "shield"
  | "box"
  | "chart"
  | "heart"
  | "phone"
  | "check"
  | "chevD"
  | "chevL"
  | "chevR"
  | "menu"
  | "x"
  | "search"
  | "sun"
  | "moon"
  | "play"
  | "pin"
  | "mail"
  | "arrowR"
  | "arrowU"
  | "image"
  | "alert"
  | "plus"
  | "minus"
  | "home"
  | "noimg";

/** สีพื้นหลังของแต่ละส่วน ตรงกับตัวเลือกในหน้าแก้ไขของแอดมิน */
export type SectionBg = "white" | "gray" | "blue" | "navy";

type Base<T extends string> = {
  id: string;
  type: T;
  hidden?: boolean;
  bg?: SectionBg;
  /** ชื่อจุดลิงก์ภายในหน้า ใส่หรือไม่ใส่ก็ได้ */
  anchor?: string;
};

type Item<T> = T & { id: string; hidden?: boolean };

export type HeroSection = Base<"hero"> & {
  /** จำนวนวินาทีก่อนเปลี่ยนสไลด์ */
  autoplay: number;
  items: Item<{ title: LText; sub: LText; img: Img; btnLabel: LText; btnUrl: string }>[];
};

export type PageHeaderSection = Base<"pageHeader"> & {
  heading: LText;
  sub: LText;
};

export type TextSection = Base<"text"> & { heading: LText; body: LText };

export type TextImageSection = Base<"textImage"> & {
  heading: LText;
  body: LText;
  img: Img;
  imgSide: "left" | "right";
  btnLabel: LText;
  btnUrl: string;
};

export type CardsSection = Base<"cards"> & {
  heading: LText;
  sub: LText;
  cols?: 2 | 3 | 4;
  items: Item<{ icon: IconName; title: LText; desc: LText }>[];
};

export type StatsSection = Base<"stats"> & {
  heading: LText;
  items: Item<{ value: LText; label: LText }>[];
};

export type ProductsSection = Base<"products"> & {
  heading: LText;
  sub: LText;
  /** ใส่ all เพื่อแสดงทุกหมวด หรือใส่รหัสหมวดหมู่ */
  category: string;
  count: number;
  /** แสดงสินค้าทั้งหมดพร้อมช่องค้นหาและปุ่มเลือกหมวด ใช้ในหน้าสินค้า */
  catalog?: boolean;
};

export type LogosSection = Base<"logos"> & {
  heading: LText;
  items: Item<{ name: string; logo: Img }>[];
};

export type TimelineSection = Base<"timeline"> & {
  heading: LText;
  items: Item<{ year: string; event: LText }>[];
};

export type GallerySection = Base<"gallery"> & {
  heading: LText;
  items: Item<{ img: Img; caption: LText }>[];
};

export type VideoSection = Base<"video"> & {
  heading: LText;
  body: LText;
  videoUrl: string;
  cover: Img;
};

export type TableSection = Base<"table"> & {
  heading: LText;
  h1: LText;
  h2: LText;
  items: Item<{ c1: LText; c2: LText }>[];
};

export type CtaSection = Base<"cta"> & {
  heading: LText;
  sub: LText;
  btnLabel: LText;
  btnUrl: string;
  btn2Label: LText;
  btn2Url: string;
};

export type FaqSection = Base<"faq"> & {
  heading: LText;
  items: Item<{ q: LText; a: LText }>[];
};

export type StepsSection = Base<"steps"> & {
  heading: LText;
  items: Item<{ title: LText; desc: LText }>[];
};

/** ข้อมูลติดต่อดึงมาจากการตั้งค่าของเว็บ ส่วนนี้เพิ่มแค่ฟอร์มติดต่อ */
export type ContactSection = Base<"contact"> & { heading: LText };

export type Section =
  | HeroSection
  | PageHeaderSection
  | TextSection
  | TextImageSection
  | CardsSection
  | StatsSection
  | ProductsSection
  | LogosSection
  | TimelineSection
  | GallerySection
  | VideoSection
  | TableSection
  | CtaSection
  | FaqSection
  | StepsSection
  | ContactSection;

export type SectionType = Section["type"];

export type Page = {
  id: string;
  title: LText;
  /** ที่อยู่ของหน้าโดยไม่มีรหัสภาษานำหน้า */
  slug: string;
  /** แสดงหน้านี้ในเมนูหลัก */
  inMenu?: boolean;
  /** หน้าหลักของระบบ ลบไม่ได้ */
  system?: boolean;
  seo?: { title?: LText; description?: LText; image?: Img };
  sections: Section[];
};

export type MenuItem = {
  id: string;
  label: LText;
  url: string;
  children?: { id: string; label: LText; url: string }[];
};

/** custom คือช่องทางอื่นที่แอดมินตั้งชื่อและอัปโหลดโลโก้เอง */
export type SocialPlatform = "facebook" | "line" | "youtube" | "instagram" | "linkedin" | "tiktok" | "x" | "custom";

export type SiteSettings = {
  /** ชื่อแบรนด์ที่แสดงบนหัวเว็บ ท้ายเว็บ และชื่อหน้า */
  siteName: LText;
  logo: Img;
  logoDark: Img;
  favicon: Img;
  seo: { title: LText; description: LText; image?: Img };
  contact: {
    address: LText;
    phone: string;
    email: string;
    hours: LText;
    /** ลิงก์จากโค้ดฝังแผนที่ของ Google Maps เป็นค่าว่างถ้ายังไม่ได้ใส่ */
    mapEmbed: string;
  };
  menu: MenuItem[];
  socials: { id: string; platform: SocialPlatform; url: string; name?: string; icon?: Img }[];
  footer: { body: LText; copyright: LText };
};

export type Category = { id: string; name: LText };

export type ProductImage = { id: string; src: Img; label: LText };

export type Product = {
  id: string;
  sku: string;
  name: LText;
  short?: LText;
  /** เนื้อหา HTML ที่กรองแล้ว เหลือเฉพาะแท็กจัดรูปแบบพื้นฐาน */
  detail?: LText;
  category: string;
  status: "pub" | "draft";
  /** รูปหลักที่แสดงในรายการสินค้า คือรูปที่ติดดาวไว้ */
  img: Img;
  images?: ProductImage[];
  specs?: { id?: string; k: LText; v: string }[];
  pdf?: { name: string; size: number; src: string } | null;
  /** วันและเวลาที่แก้ไขล่าสุดตามเวลาท้องถิ่น */
  updatedAt?: string;
  /** รหัสผู้ดูแลที่แก้ไขล่าสุด */
  updatedBy?: number;
};

/* ธีมและตัวอักษรของเว็บ ค่าเหล่านี้จะถูกนำไปใช้กับสีและขนาดทั้งเว็บ */
export type SizeKey = "h1" | "h2" | "h3" | "body" | "btn" | "menu";
export type ColorKey = "primary" | "accent" | "bg" | "bg2" | "heading" | "text" | "muted";
export type CustomFont = { name: string; kind: "google" | "file"; src?: string };

export type Design = {
  fonts: { heading: string; body: string };
  customFonts: CustomFont[];
  /** ขนาดตัวอักษรเป็นพิกเซล แยกตามคอมพิวเตอร์ แท็บเล็ต และมือถือ */
  sizes: Record<SizeKey, { d: number; t: number; m: number }>;
  weight: { heading: number; body: number };
  lh: { heading: number; body: number };
  /** ระยะห่างระหว่างตัวอักษร */
  ls: { heading: number; body: number };
  colors: { light: Record<ColorKey, string>; dark: Record<ColorKey, string> };
  /** ความโค้งของมุมการ์ดและกล่องเป็นพิกเซล */
  radius: number;
  /** ความโค้งของมุมปุ่มเป็นพิกเซล 999 คือปุ่มทรงแคปซูล */
  btnRadius: number;
  /** ความโค้งของมุมรูปภาพเป็นพิกเซล */
  imgRadius: number;
  /** ความโค้งของมุมช่องค้นหาและช่องกรอกเป็นพิกเซล 999 คือทรงแคปซูล */
  inputRadius: number;
  /** ตัวคูณระยะห่างระหว่างส่วน 0.75 คือแน่น 1 คือปกติ 1.3 คือโปร่ง */
  spacing: number;
};
