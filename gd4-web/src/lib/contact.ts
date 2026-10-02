/** กฎตรวจฟอร์มติดต่อ ใช้ร่วมกันทั้งฝั่งเบราว์เซอร์และฝั่งเซิร์ฟเวอร์ */

export type ContactInput = { name: string; company: string; phone: string; email: string; msg: string };
export type ContactField = keyof ContactInput;
export type ContactErrorKey = "eName" | "ePhone" | "eEmail" | "eMsg";
export type ContactErrors = Partial<Record<ContactField, ContactErrorKey>>;

export const EMPTY_CONTACT: ContactInput = { name: "", company: "", phone: "", email: "", msg: "" };

const LIMITS: Record<ContactField, number> = { name: 120, company: 160, phone: 30, email: 160, msg: 5000 };

export function validateContact(f: ContactInput): ContactErrors {
  const e: ContactErrors = {};
  if (!f.name.trim()) e.name = "eName";
  if (f.phone.replace(/\D/g, "").length < 9) e.phone = "ePhone";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "eEmail";
  if (f.msg.trim().length < 10) e.msg = "eMsg";
  return e;
}

/** อ่านข้อมูลจากฟอร์ม ตัดช่องว่างหัวท้าย และตัดความยาวแต่ละช่องไม่ให้เกินที่กำหนด */
export function readContact(fd: FormData): ContactInput {
  const get = (k: ContactField) => String(fd.get(k) ?? "").trim().slice(0, LIMITS[k]);
  return { name: get("name"), company: get("company"), phone: get("phone"), email: get("email"), msg: get("msg") };
}
