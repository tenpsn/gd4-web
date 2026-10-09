/** ข้อความคงที่ของหน้าเว็บ แก้จากหลังบ้านไม่ได้ */
import type { LText, Locale } from "@/types/site";

const L = (th: string, en: string): LText => ({ th, en });

const DICT = {
  quote: L("ขอใบเสนอราคา", "Request a quote"),
  viewAll: L("ดูสินค้าทั้งหมด", "View all products"),
  detail: L("ดูรายละเอียด", "View details"),
  home: L("หน้าแรก", "Home"),
  more: L("เพิ่มเติม", "More"),
  menu: L("เมนู", "Menu"),
  openMenu: L("เปิดเมนู", "Open menu"),
  close: L("ปิด", "Close"),
  toTop: L("กลับขึ้นด้านบน", "Back to top"),
  gallery: L("รูปสินค้า", "Product photos"),
  prevImg: L("รูปก่อนหน้า", "Previous photo"),
  nextImg: L("รูปถัดไป", "Next photo"),
  showImg: L("ดูรูปที่", "Show photo"),
  theme: L("สลับโหมดสว่าง/มืด", "Toggle light/dark mode"),
  language: L("ภาษา", "Language"),
  prev: L("ก่อนหน้า", "Previous"),
  next: L("ถัดไป", "Next"),
  slide: L("สไลด์", "Slide"),
  play: L("เล่นวิดีโอ", "Play video"),
  openMap: L("เปิดแผนที่", "Open map"),
  follow: L("ติดตามเรา", "Follow us"),
  contact: L("ติดต่อเรา", "Contact"),
  p: {
    search: L("ค้นหาชื่อสินค้าหรือรหัส เช่น PM-12", "Search by name or SKU, e.g. PM-12"),
    all: L("ทั้งหมด", "All"),
    noImg: L("ยังไม่มีรูปสินค้า", "No image yet"),
    img: L("ภาพสินค้า", "Product photo"),
    emptyT: L("ยังไม่มีสินค้าในหมวดนี้", "No products in this category yet"),
    emptyD: L(
      "เรามีเครื่องมือแพทย์กว่า 850 รายการที่ยังไม่ได้แสดงบนเว็บไซต์ ติดต่อฝ่ายขายเพื่อสอบถามรุ่นที่ต้องการ",
      "We carry over 850 devices not yet listed online. Ask our sales team about the model you need.",
    ),
    askSales: L("สอบถามฝ่ายขาย", "Ask our sales team"),
    noResT: L("ไม่พบสินค้าที่ตรงกับ", "No products match"),
    noResD: L("ลองใช้คำที่สั้นลง หรือค้นด้วยรหัสสินค้า", "Try a shorter term or search by SKU"),
    clear: L("ล้างการค้นหา", "Clear search"),
    try: L("ลองค้นหา", "Try"),
    count: L("รายการ", "items"),
    sku: L("รหัสสินค้า", "SKU"),
    category: L("หมวดหมู่", "Category"),
    specs: L("ข้อมูลจำเพาะ", "Specifications"),
    noSpecs: L(
      "ติดต่อฝ่ายขายเพื่อขอเอกสารข้อมูลจำเพาะและใบเสนอราคาของรุ่นนี้",
      "Contact our sales team for the specification sheet and a quote for this model.",
    ),
    back: L("กลับไปหน้าสินค้า", "Back to products"),
    products: L("สินค้า", "Products"),
    catalog: L("ดาวน์โหลดแคตตาล็อก PDF", "Download PDF catalog"),
  },
  c: {
    address: L("ที่อยู่", "Address"),
    phone: L("โทรศัพท์", "Phone"),
    email: L("อีเมล", "Email"),
    hours: L("เวลาทำการ", "Hours"),
    name: L("ชื่อ-นามสกุล", "Full name"),
    company: L("บริษัท / หน่วยงาน", "Company / organization"),
    fphone: L("เบอร์โทรศัพท์", "Phone number"),
    femail: L("อีเมล", "Email"),
    msg: L("ข้อความ", "Message"),
    send: L("ส่งข้อความ", "Send message"),
    sending: L("กำลังส่ง…", "Sending…"),
    eName: L("กรุณากรอกชื่อ", "Enter your name"),
    ePhone: L("กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก", "Enter a phone number of at least 9 digits"),
    eEmail: L("รูปแบบอีเมลไม่ถูกต้อง", "Enter a valid email"),
    eMsg: L("กรุณาเขียนข้อความอย่างน้อย 10 ตัวอักษร", "Write at least 10 characters"),
    consent: L(
      "ข้าพเจ้ายินยอมให้บริษัทเก็บและใช้ชื่อ เบอร์โทร อีเมล และข้อความข้างต้น เพื่อติดต่อกลับและตอบคำถามของข้าพเจ้า",
      "I agree that the company may collect and use my name, phone, email and message above to contact me and answer my enquiry.",
    ),
    eConsent: L("กรุณาติ๊กยินยอมก่อนส่งข้อความ", "Please tick the box to agree before sending"),
    okT: L("ส่งข้อความเรียบร้อย", "Message sent"),
    okD: L("ขอบคุณที่ติดต่อเรา ทีมงานจะติดต่อกลับภายใน 1 วันทำการ", "Thank you. We will get back to you within one business day."),
    again: L("ส่งข้อความใหม่", "Send another message"),
    errT: L("ส่งข้อความไม่สำเร็จ", "Message not sent"),
    errD: L(
      "การเชื่อมต่อมีปัญหา ข้อความของคุณยังอยู่ในฟอร์ม ลองอีกครั้งหรือโทร 02-123-4567",
      "A connection problem occurred. Your message is still in the form. Try again or call 02-123-4567.",
    ),
  },
  nf: {
    t: L("ไม่พบหน้าที่คุณต้องการ", "We couldn’t find that page"),
    d: L(
      "หน้านี้อาจถูกย้ายหรือลบไปแล้ว ลองค้นหาสินค้า หรือกลับไปหน้าแรก",
      "The page may have moved or been removed. Search for a product or head back home.",
    ),
    home: L("กลับหน้าแรก", "Back to home"),
  },
};

type Resolve<T> = T extends LText ? string : { [K in keyof T]: Resolve<T[K]> };
export type Dict = Resolve<typeof DICT>;

function resolve(o: unknown, lang: Locale): unknown {
  if (o && typeof o === "object") {
    if ("th" in o && "en" in o) return (o as LText)[lang];
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, resolve(v, lang)]));
  }
  return o;
}

const cache: Partial<Record<Locale, Dict>> = {};
export const getDict = (lang: Locale): Dict => (cache[lang] ??= resolve(DICT, lang) as Dict);
