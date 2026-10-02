/** เนื้อหาตัวอย่างจากแบบร่าง ใช้แทนฐานข้อมูลไปก่อน
 * ให้อ่านผ่าน content.ts เท่านั้น เพื่อจะเปลี่ยนแหล่งข้อมูลได้ภายหลัง */
import type { LText, Page, Section, SiteSettings } from "@/types/site";

const L = (th: string, en: string): LText => ({ th, en });
const E = L("", "");

let n = 0;
const id = (p: string) => `${p}${++n}`;
const items = <T extends object>(list: T[]) => list.map((x) => ({ id: id("i"), ...x }));

const ctaQuote = (): Section => ({
  id: id("s"),
  type: "cta",
  bg: "navy",
  heading: L("ต้องการใบเสนอราคาหรือนัดสาธิต?", "Need a quote or a demo?"),
  sub: L("ทีมขายตอบกลับภายใน 1 วันทำการ", "Our sales team replies within one business day"),
  btnLabel: L("ขอใบเสนอราคา", "Request a quote"),
  btnUrl: "/contact",
  btn2Label: L("โทร 02-123-4567", "Call 02-123-4567"),
  btn2Url: "tel:021234567",
});

const faqItems = items([
  { q: L("ระยะเวลารับประกันกี่ปี?", "How long is the warranty?"), a: L("สินค้าทุกรายการรับประกัน 2 ปี ครอบคลุมอะไหล่และค่าแรง", "Every product has a 2-year warranty covering parts and labor.") },
  { q: L("แจ้งซ่อมนอกเวลาทำการได้ไหม?", "Can I request repairs after hours?"), a: L("ได้ ทางโทรศัพท์และ LINE ตลอด 24 ชั่วโมง", "Yes, by phone and LINE, 24 hours a day.") },
  { q: L("มีเครื่องสำรองระหว่างซ่อมหรือไม่?", "Do you lend equipment during repairs?"), a: L("มีสำหรับเครื่องติดตามสัญญาณชีพและเครื่องให้สารละลาย", "Yes, for patient monitors and infusion pumps.") },
  { q: L("สอบเทียบเครื่องยี่ห้ออื่นได้ไหม?", "Do you calibrate other brands?"), a: L("ได้ ติดต่อฝ่ายบริการเพื่อตรวจสอบรุ่นที่รองรับ", "Yes. Contact our service team to check supported models.") },
]);

export const SETTINGS: SiteSettings = {
  siteName: L("GD4 Medical", "GD4 Medical"),
  logo: null,
  logoDark: null,
  favicon: null,
  languages: [
    { code: "th", name: "ไทย", on: true, def: true, fixed: true },
    { code: "en", name: "English", on: true, fixed: true },
  ],
  autoBackup: true,
  seo: {
    title: L("GD4 Medical · ผู้จัดจำหน่ายเครื่องมือแพทย์ครบวงจร", "GD4 Medical · End-to-end medical equipment distributor"),
    description: L(
      "จัดหา ติดตั้ง และดูแลเครื่องมือแพทย์ให้โรงพยาบาลและคลินิกทั่วประเทศ บริการหลังการขาย 24 ชั่วโมง",
      "Sourcing, installation and lifetime support of medical equipment for hospitals and clinics nationwide, with 24-hour service.",
    ),
  },
  contact: {
    address: L("99/9 อาคารจีดีโฟร์ ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310", "99/9 GD4 Building, Rama 9 Road, Huai Khwang, Bangkok 10310"),
    phone: "02-123-4567",
    email: "info@gdfourmedical.com",
    hours: L("จันทร์–ศุกร์ 08:30–17:30 น. · เสาร์ 08:30–12:00 น.", "Mon–Fri 08:30–17:30 · Sat 08:30–12:00"),
    lat: 13.7563,
    lng: 100.5651,
  },
  menu: [
    { id: "m-home", label: L("หน้าแรก", "Home"), url: "/" },
    {
      id: "m-about",
      label: L("เกี่ยวกับเรา", "About us"),
      url: "/about",
      children: [
        { id: "m-history", label: L("ประวัติบริษัท", "Our story"), url: "/about#history" },
        { id: "m-team", label: L("ทีมผู้บริหาร", "Leadership"), url: "/about#team" },
        { id: "m-certs", label: L("ใบรับรอง", "Certifications"), url: "/about#certs" },
      ],
    },
    {
      id: "m-products",
      label: L("สินค้า", "Products"),
      url: "/products",
      children: [
        { id: "m-p-all", label: L("สินค้าทั้งหมด", "All products"), url: "/products" },
        { id: "m-p-mon", label: L("ติดตามสัญญาณชีพ", "Patient monitoring"), url: "/products?cat=mon" },
        { id: "m-p-img", label: L("ภาพวินิจฉัย", "Diagnostic imaging"), url: "/products?cat=img" },
        { id: "m-p-emg", label: L("ฉุกเฉินและกู้ชีพ", "Emergency"), url: "/products?cat=emg" },
        { id: "m-p-sur", label: L("ห้องผ่าตัด", "Operating room"), url: "/products?cat=sur" },
        { id: "m-p-lab", label: L("ห้องปฏิบัติการ", "Laboratory"), url: "/products?cat=lab" },
        { id: "m-p-reh", label: L("เตียงและกายภาพ", "Beds & rehab"), url: "/products?cat=reh" },
      ],
    },
    {
      id: "m-service",
      label: L("บริการหลังการขาย", "Service"),
      url: "/service",
      children: [
        { id: "m-repair", label: L("แจ้งซ่อม", "Request a repair"), url: "/contact" },
        { id: "m-calib", label: L("สอบเทียบเครื่องมือ", "Calibration"), url: "/service#steps" },
        { id: "m-faq", label: L("คำถามที่พบบ่อย", "FAQ"), url: "/service#faq" },
      ],
    },
    { id: "m-contact", label: L("ติดต่อเรา", "Contact"), url: "/contact" },
  ],
  socials: [
    { id: "so1", platform: "facebook", url: "https://facebook.com/gdfourmedical" },
    { id: "so2", platform: "line", url: "https://line.me/R/ti/p/@gd4medical" },
    { id: "so3", platform: "youtube", url: "https://youtube.com/@gd4medical" },
    { id: "so4", platform: "instagram", url: "https://instagram.com/gdfourmedical" },
  ],
  footer: {
    body: L("ผู้จัดจำหน่ายเครื่องมือแพทย์ครบวงจร จัดหา ติดตั้ง และดูแลตลอดอายุการใช้งาน", "End-to-end medical equipment distributor: sourcing, installation and lifetime support."),
    copyright: L("© 2569 บริษัท จีดีโฟร์ เมดิคอล จำกัด สงวนลิขสิทธิ์", "© 2026 GD4 Medical Co., Ltd. All rights reserved."),
  },
};

export const PAGES: Page[] = [
  {
    id: "home",
    title: L("หน้าแรก", "Home"),
    slug: "/",
    inMenu: true,
    system: true,
    sections: [
      {
        id: id("s"),
        type: "hero",
        bg: "navy",
        autoplay: 6,
        items: items([
          { title: L("เครื่องมือแพทย์มาตรฐานสากล พร้อมทีมดูแลที่คุณวางใจได้", "Certified medical equipment, backed by a team you can rely on"), sub: L("จัดหา ติดตั้ง และดูแลเครื่องมือแพทย์ให้โรงพยาบาลและคลินิกทั่วประเทศ", "Sourcing, installation and lifetime support for hospitals and clinics nationwide"), img: "placeholder", imgAlt: L("ภาพหอผู้ป่วยวิกฤต", "ICU ward"), btnLabel: L("ดูสินค้าทั้งหมด", "View all products"), btnUrl: "/products" },
          { title: L("ติดตามผู้ป่วยแม่นยำ ทุกเตียงตลอด 24 ชั่วโมง", "Accurate monitoring at every bedside, around the clock"), sub: L("เครื่องติดตามสัญญาณชีพเชื่อมต่อสถานีพยาบาล แจ้งเตือนได้ทันที", "Monitors connect to the nurse station and alert instantly"), img: "placeholder", imgAlt: L("เครื่อง PM-12", "PM-12 monitor"), btnLabel: L("ดูสินค้าทั้งหมด", "View all products"), btnUrl: "/products" },
          { title: L("ภาพวินิจฉัยคมชัด", "Clear diagnostic imaging"), sub: L("อัลตราซาวด์และเอกซเรย์ดิจิทัล พร้อมติดตั้งโดยวิศวกร", "Ultrasound and digital X-ray, installed by our engineers"), img: "placeholder", imgAlt: L("ห้องตรวจอัลตราซาวด์", "Ultrasound room"), btnLabel: L("ดูสินค้าทั้งหมด", "View all products"), btnUrl: "/products" },
          { title: L("วิศวกรพร้อมดูแลเครื่องของคุณทั่วประเทศ", "Engineers nationwide"), sub: L("ศูนย์บริการ 3 แห่ง ครอบคลุม 77 จังหวัด", "Three service centers covering all 77 provinces"), img: "placeholder", imgAlt: L("วิศวกรหน้างาน", "Engineer on site"), btnLabel: L("ดูสินค้าทั้งหมด", "View all products"), btnUrl: "/products" },
        ]),
      },
      {
        id: id("s"),
        type: "cards",
        bg: "white",
        heading: L("ทำไมโรงพยาบาลเลือก GD4", "Why hospitals choose GD4"),
        sub: L("ดูแลตั้งแต่การเลือกเครื่องไปจนถึงวันที่ต้องเปลี่ยนเครื่องใหม่", "From choosing equipment to replacing it years later"),
        items: items([
          { icon: "award" as const, title: L("สินค้ามาตรฐานสากล", "Internationally certified"), desc: L("ทุกรายการผ่านการรับรอง ISO 13485 และได้รับอนุญาตจาก อย.", "Every product is ISO 13485 certified and Thai FDA licensed.") },
          { icon: "users" as const, title: L("ติดตั้งและอบรมโดยวิศวกร", "Installed and taught by engineers"), desc: L("ทีมวิศวกรติดตั้งและอบรมผู้ใช้งานถึงหน้างาน พร้อมคู่มือภาษาไทยสำหรับทุกเครื่อง", "Engineers install on site and train your staff.") },
          { icon: "clock" as const, title: L("บริการ 24 ชม.", "24-hour service"), desc: L("ตอบรับภายใน 2 ชั่วโมง ทุกวันรวมวันหยุดนักขัตฤกษ์", "2-hour response, day or night, every day of the year including public holidays.") },
          { icon: "shield" as const, title: L("รับประกัน 2 ปี", "2-year warranty"), desc: L("ครอบคลุมอะไหล่และค่าแรง", "Covers parts and labor.") },
        ]),
      },
      {
        id: id("s"),
        type: "stats",
        bg: "blue",
        heading: L("GD4 ในตัวเลข", "GD4 in numbers"),
        items: items([
          { value: L("2009", "2009"), label: L("ปีที่ก่อตั้งบริษัท", "Year founded") },
          { value: L("1,200+", "1,200+"), label: L("โรงพยาบาลและคลินิกที่ไว้วางใจ", "Hospitals and clinics served") },
          { value: L("850+", "850+"), label: L("รายการสินค้า", "Products") },
          { value: L("98%", "98%"), label: L("งานซ่อมเสร็จตามกำหนด", "Repairs on schedule") },
        ]),
      },
      { id: id("s"), type: "products", bg: "white", heading: L("สินค้าแนะนำ", "Featured products"), sub: E, category: "all", count: 4 },
      {
        id: id("s"),
        type: "logos",
        bg: "gray",
        heading: L("พันธมิตรผู้ผลิต", "Manufacturing partners"),
        items: items(["Novacare", "Helix Medical", "Orion Bio", "Kinetica", "Sanaris", "Vitalon", "Medora", "Pulsar Health"].map((name) => ({ name, logo: null }))),
      },
      ctaQuote(),
    ],
  },
  {
    id: "about",
    title: L("เกี่ยวกับเรา", "About us"),
    slug: "/about",
    inMenu: true,
    system: true,
    sections: [
      {
        id: id("s"),
        type: "pageHeader",
        bg: "navy",
        heading: L("เกี่ยวกับเรา", "About us"),
        sub: L("GD4 Medical ก่อตั้งในปี 2552 เป็นผู้จัดจำหน่ายเครื่องมือแพทย์ครบวงจร ดูแลตั้งแต่การจัดหา ติดตั้ง อบรม ไปจนถึงบริการหลังการขายตลอดอายุการใช้งาน", "Founded in 2009, GD4 Medical is an end-to-end medical equipment distributor covering sourcing, installation, training and after-sales service for the full life of each device."),
      },
      {
        id: id("s"),
        type: "textImage",
        bg: "white",
        anchor: "history",
        heading: L("เกี่ยวกับ GD4 Medical", "About GD4 Medical"),
        body: L("GD4 Medical ก่อตั้งในปี 2552 เป็นผู้จัดจำหน่ายเครื่องมือแพทย์ครบวงจร ดูแลตั้งแต่การจัดหา ติดตั้ง อบรม ไปจนถึงบริการหลังการขายตลอดอายุการใช้งาน", "Founded in 2009, GD4 Medical is an end-to-end medical equipment distributor covering sourcing, installation, training and after-sales service for the full life of each device."),
        img: "placeholder",
        imgAlt: L("อาคารสำนักงานใหญ่", "Head office"),
        imgSide: "right",
        btnLabel: L("ติดต่อเรา", "Contact us"),
        btnUrl: "/contact",
      },
      {
        id: id("s"),
        type: "timeline",
        bg: "gray",
        heading: L("เส้นทางของเรา", "Our journey"),
        items: items([
          { year: "2009", event: L("ก่อตั้งบริษัทที่กรุงเทพฯ", "Founded in Bangkok") },
          { year: "2013", event: L("ได้รับการรับรอง ISO 13485", "ISO 13485 certified") },
          { year: "2017", event: L("เปิดศูนย์บริการเชียงใหม่และขอนแก่น", "Chiang Mai and Khon Kaen service centers open") },
          { year: "2025", event: L("เปิดระบบแจ้งซ่อมออนไลน์ 24 ชม.", "24-hour online repair requests") },
        ]),
      },
      {
        id: id("s"),
        type: "cards",
        bg: "white",
        anchor: "certs",
        heading: L("ใบรับรองและมาตรฐาน", "Certifications"),
        sub: E,
        items: items([
          { icon: "check" as const, title: L("ISO 13485:2016", "ISO 13485:2016"), desc: L("ระบบบริหารคุณภาพเครื่องมือแพทย์", "Medical device quality management") },
          { icon: "check" as const, title: L("ใบอนุญาต อย.", "Thai FDA license"), desc: L("นำเข้าและจำหน่ายเครื่องมือแพทย์", "Import and distribution of medical devices") },
          { icon: "check" as const, title: L("CE Marking", "CE Marking"), desc: L("สินค้าผ่านข้อกำหนดของสหภาพยุโรป", "Products meet EU requirements") },
          { icon: "check" as const, title: L("ISO 9001:2015", "ISO 9001:2015"), desc: L("ระบบบริหารงานคุณภาพองค์กร", "Organizational quality management") },
        ]),
      },
      {
        id: id("s"),
        type: "textImage",
        bg: "gray",
        anchor: "team",
        heading: L("ทีมวิศวกรที่ดูแลคุณ", "The engineers behind your equipment"),
        body: L("วิศวกรชีวการแพทย์กว่า 40 คน ผ่านการอบรมจากผู้ผลิตโดยตรงและอบรมซ้ำทุกปี", "Over 40 biomedical engineers, trained by manufacturers and retrained every year."),
        img: "placeholder",
        imgAlt: L("ทีมวิศวกร GD4", "GD4 engineers"),
        imgSide: "left",
        btnLabel: L("บริการหลังการขาย", "Service"),
        btnUrl: "/service",
      },
      {
        id: id("s"),
        type: "gallery",
        bg: "white",
        heading: L("สำนักงานและศูนย์บริการ", "Offices and service centers"),
        items: items([
          { img: "placeholder", caption: L("สำนักงานใหญ่ กรุงเทพฯ", "Head office, Bangkok") },
          { img: "placeholder", caption: L("ศูนย์บริการเชียงใหม่", "Chiang Mai service center") },
          { img: "placeholder", caption: L("ศูนย์บริการขอนแก่น", "Khon Kaen service center") },
          { img: "placeholder", caption: L("ห้องสอบเทียบ", "Calibration lab") },
        ]),
      },
      ctaQuote(),
    ],
  },
  {
    id: "products",
    title: L("สินค้า", "Products"),
    slug: "/products",
    inMenu: true,
    system: true,
    sections: [
      {
        id: id("s"),
        type: "pageHeader",
        bg: "navy",
        heading: L("สินค้าของเรา", "Our products"),
        sub: L("เครื่องมือแพทย์กว่า 850 รายการ ครอบคลุมหอผู้ป่วยวิกฤต ห้องผ่าตัด ห้องปฏิบัติการ และงานกายภาพบำบัด", "Over 850 devices for intensive care, operating rooms, laboratories and rehabilitation."),
      },
      { id: id("s"), type: "products", bg: "white", heading: L("สินค้าของเรา", "Our products"), sub: E, category: "all", count: 0, catalog: true },
      {
        id: id("s"),
        type: "table",
        bg: "gray",
        heading: L("บริการที่มาพร้อมทุกการสั่งซื้อ", "Included with every order"),
        h1: L("บริการ", "Service"),
        h2: L("รายละเอียด", "Details"),
        items: items([
          { c1: L("ติดตั้ง", "Installation"), c2: L("โดยวิศวกรชีวการแพทย์ ไม่มีค่าใช้จ่าย", "By biomedical engineers, free of charge") },
          { c1: L("อบรมการใช้งาน", "Training"), c2: L("ที่หน้างาน พร้อมคู่มือภาษาไทย", "On site, with Thai manuals") },
          { c1: L("รับประกัน", "Warranty"), c2: L("2 ปี ทั้งอะไหล่และค่าแรง", "2 years, parts and labor") },
          { c1: L("สอบเทียบ", "Calibration"), c2: L("ปีละ 1 ครั้งตลอดระยะประกัน", "Yearly during the warranty") },
        ]),
      },
      { id: id("s"), type: "faq", bg: "white", heading: L("คำถามที่พบบ่อย", "Frequently asked questions"), items: faqItems },
    ],
  },
  {
    id: "service",
    title: L("บริการหลังการขาย", "Service"),
    slug: "/service",
    inMenu: true,
    system: true,
    sections: [
      {
        id: id("s"),
        type: "pageHeader",
        bg: "navy",
        heading: L("ดูแลเครื่องของคุณตลอดอายุการใช้งาน", "Support for the full life of your equipment"),
        sub: L("ศูนย์บริการ 3 แห่ง วิศวกรกว่า 40 คน พร้อมแจ้งซ่อมได้ 24 ชั่วโมง", "Three service centers, 40+ engineers, repairs requested 24/7"),
      },
      {
        id: id("s"),
        type: "steps",
        bg: "gray",
        anchor: "steps",
        heading: L("ขั้นตอนการแจ้งซ่อม", "How repairs work"),
        items: items([
          { title: L("แจ้งปัญหา", "Report an issue"), desc: L("โทร LINE หรือฟอร์มออนไลน์ 24 ชั่วโมง", "Call, LINE or online form, 24/7") },
          { title: L("ประเมินเบื้องต้น", "Initial assessment"), desc: L("วิศวกรติดต่อกลับภายใน 2 ชั่วโมง", "An engineer calls back within 2 hours") },
          { title: L("นัดหมายเข้าหน้างาน", "Schedule a visit"), desc: L("เลือกวันเวลาที่ไม่กระทบการรักษา", "At a time that doesn’t disrupt care") },
          { title: L("เข้าซ่อมถึงที่", "On-site repair"), desc: L("ถึงหน้างานภายใน 24 ชั่วโมง", "On site within 24 hours") },
        ]),
      },
      {
        id: id("s"),
        type: "video",
        bg: "gray",
        heading: L("ดูวิธีแจ้งซ่อมออนไลน์", "How to request a repair online"),
        body: L("วิดีโอสาธิต 2 นาที", "A 2-minute walkthrough"),
        // ต้องใส่ลิงก์ YouTube จริงแทน
        videoUrl: "",
        cover: "placeholder",
      },
      { id: id("s"), type: "faq", bg: "white", anchor: "faq", heading: L("คำถามที่พบบ่อย", "Frequently asked questions"), items: faqItems },
      {
        id: id("s"),
        type: "cta",
        bg: "navy",
        heading: L("เครื่องมีปัญหา? แจ้งซ่อมได้ตลอด 24 ชั่วโมง", "Equipment issue? Report it 24/7"),
        sub: L("วิศวกรติดต่อกลับภายใน 2 ชั่วโมง", "An engineer calls back within 2 hours"),
        btnLabel: L("แจ้งซ่อมออนไลน์", "Request a repair"),
        btnUrl: "/contact",
        btn2Label: L("โทร 02-123-4567", "Call 02-123-4567"),
        btn2Url: "tel:021234567",
      },
    ],
  },
  {
    id: "contact",
    title: L("ติดต่อเรา", "Contact"),
    slug: "/contact",
    inMenu: true,
    system: true,
    sections: [
      {
        id: id("s"),
        type: "pageHeader",
        bg: "navy",
        heading: L("ติดต่อเรา", "Contact us"),
        sub: L("สอบถามสินค้า ขอใบเสนอราคา หรือแจ้งซ่อม ทีมงานพร้อมช่วยเหลือ", "Questions, quotes or repairs, we are here to help"),
      },
      { id: id("s"), type: "contact", bg: "white", heading: L("ส่งข้อความถึงเรา", "Send us a message") },
    ],
  },
];
