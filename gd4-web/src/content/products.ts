/** สินค้าตัวอย่างจากต้นแบบหลังบ้าน ภายหลังจะใช้ข้อมูลจากตารางสินค้าแทน */
import type { Category, LText, Product } from "@/types/site";

const L = (th: string, en: string): LText => ({ th, en });

export const CATEGORIES: Category[] = [
  { id: "mon", name: L("ติดตามสัญญาณชีพ", "Patient monitoring") },
  { id: "img", name: L("ภาพวินิจฉัย", "Diagnostic imaging") },
  { id: "emg", name: L("ฉุกเฉินและกู้ชีพ", "Emergency") },
  { id: "sur", name: L("ห้องผ่าตัด", "Operating room") },
  { id: "lab", name: L("ห้องปฏิบัติการ", "Laboratory") },
  { id: "reh", name: L("เตียงและกายภาพ", "Beds & rehab") },
];

const P = (sku: string, th: string, en: string, category: string, status: Product["status"] = "pub"): Product => ({
  id: sku.toLowerCase(),
  sku,
  name: L(th, en),
  category,
  status,
  img: "placeholder",
});

export const PRODUCTS: Product[] = [
  P("PM-12", "เครื่องติดตามสัญญาณชีพ PM-12", "PM-12 Patient Monitor", "mon"),
  P("UX-80", "เครื่องอัลตราซาวด์ UX-80", "UX-80 Ultrasound System", "img"),
  P("AED-7", "เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ AED-7", "AED-7 Automated External Defibrillator", "emg"),
  P("DR-M", "เอกซเรย์ดิจิทัลเคลื่อนที่ DR-M", "DR-M Mobile Digital X-ray", "img", "draft"),
  P("VS-3", "เครื่องวัดสัญญาณชีพ VS-3", "VS-3 Vital Signs Monitor", "mon"),
  P("SP-200", "เครื่องดูดเสมหะ SP-200", "SP-200 Suction Aspirator", "emg"),
  P("ECG-12", "เครื่องตรวจคลื่นไฟฟ้าหัวใจ 12 ลีด", "12-Lead ECG Machine", "mon"),
  P("ESU-400", "เครื่องจี้ไฟฟ้าผ่าตัด ESU-400", "ESU-400 Electrosurgical Unit", "sur", "draft"),
  P("OL-5", "โคมไฟผ่าตัด LED OL-5", "OL-5 LED Surgical Light", "sur"),
  P("IP-60", "เครื่องให้สารละลายทางหลอดเลือด IP-60", "IP-60 Infusion Pump", "mon"),
  P("CF-24", "เครื่องปั่นเหวี่ยงตกตะกอน CF-24", "CF-24 Laboratory Centrifuge", "lab"),
  P("AC-50", "เครื่องอบฆ่าเชื้อด้วยไอน้ำ AC-50", "AC-50 Steam Autoclave", "lab", "draft"),
  P("HB-5F", "เตียงผู้ป่วยไฟฟ้า 5 ฟังก์ชัน", "5-Function Electric Hospital Bed", "reh"),
  P("TN-2", "เครื่องกระตุ้นไฟฟ้ากายภาพบำบัด TN-2", "TN-2 TENS Therapy Unit", "reh"),
];
