/**
 * โครงสร้างข้อมูลฝั่งหลังบ้าน ตามต้นแบบหน้าแอดมิน
 * แต่ละรายการเก็บเป็นหนึ่งแถวในตาราง PostgreSQL ดูที่ server db.ts
 */
import type { Category, Design, LText, Page, Product, SiteSettings } from "@/types/site";

export type Role = "super" | "editor" | "products" | "viewer";
export const ROLES: Role[] = ["super", "editor", "products", "viewer"];

export type Area = "dashboard" | "products" | "content" | "design" | "inbox" | "users" | "activity" | "settings";
export const AREAS: Area[] = ["dashboard", "products", "content", "design", "inbox", "users", "activity", "settings"];

export type Action = "view" | "edit" | "del" | "publish";
export const ACTIONS: Action[] = ["view", "edit", "del", "publish"];

export type Perms = Record<Role, Record<Area, Record<Action, boolean>>>;

/** สิทธิ์ที่ใช้ได้ในแต่ละส่วน ส่วนที่ไม่ได้ระบุใช้ได้ทุกสิทธิ์ ประวัติการแก้ไขมีแค่ดูกับลบ */
export const AREA_ACTIONS: Partial<Record<Area, Action[]>> = { activity: ["view", "del"] };
export const allowed = (a: Area, x: Action) => (AREA_ACTIONS[a] ?? ACTIONS).includes(x);
/** สิทธิ์ที่ให้ได้เฉพาะผู้ดูแลสูงสุด ลบประวัติได้แค่ผู้ดูแลสูงสุดเพื่อให้ประวัติใช้เป็นหลักฐานได้ */
export const superOnly = (a: Area, x: Action) => a === "activity" && x === "del";

export type AdminUser = {
  id: number;
  name: LText;
  /** ตัวอักษรย่อที่แสดงในรูปโปรไฟล์ */
  ini: LText;
  email: string;
  role: Role;
  status: "active" | "suspended" | "invited";
  /** วันเวลาที่เข้าระบบล่าสุด เป็น null ถ้ายังไม่เคยเข้า */
  lastActive: string | null;
  /** รหัสผ่านที่เข้ารหัสแล้ว เป็น null ถ้าผู้ที่ถูกเชิญยังไม่ได้ตั้งรหัสผ่าน */
  passwordHash: string | null;
  /** ข้อมูลลิงก์เชิญที่ใช้ได้ครั้งเดียว และเวลาหมดอายุ */
  inviteHash?: string;
  inviteExpires?: number;
  /** รุ่นการเข้าระบบ เพิ่มขึ้นทุกครั้งที่เปลี่ยนรหัสผ่าน เพื่อให้เครื่องอื่นที่เข้าระบบอยู่หลุดออก */
  sessionVer?: number;
};

/** ข้อมูลผู้ใช้ที่ส่งไปหน้าเว็บได้อย่างปลอดภัย */
export type PublicUser = Omit<AdminUser, "passwordHash" | "inviteHash" | "inviteExpires" | "sessionVer">;

export type MessageStatus = "new" | "read" | "replied";

export type Message = {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  msg: string;
  subject: string;
  date: string;
  /** เวลาที่ลูกค้าติ๊กยินยอมให้เก็บข้อมูล ข้อความเก่าก่อนมีช่องนี้จะไม่มีค่า */
  consentAt?: string;
  status: MessageStatus;
};

export type Activity = {
  id: number;
  userId: number;
  action: LText;
  target: LText;
  when: string;
};

export type DB = {
  version: 1;
  settings: SiteSettings;
  pages: Page[];
  categories: Category[];
  products: Product[];
  messages: Message[];
  users: AdminUser[];
  perms: Perms;
  activity: Activity[];
  lastEdit: { page: string; userId: number; when: string };
  /** รูปภาพที่อัปโหลดไว้ในคลังรูป */
  media: MediaItem[];
  design: Design;
  /** งานแก้ไขที่ยังไม่เผยแพร่ เป็น null ถ้าไม่มีงานค้าง */
  draft: (Working & { userId: number; when: string }) | null;
  /** เลขรุ่นงานร่างที่เพิ่มทุกครั้งที่มีการเปลี่ยน ใช้ตรวจว่ามีคนแก้ทับกันหรือไม่ */
  draftRev: number;
};

/** ส่วนที่ใช้ทั้งเว็บ ซึ่งแก้ได้ในแท็บทั้งเว็บของหน้าแก้ไขเนื้อหา */
export type GlobalContent = Pick<SiteSettings, "menu" | "socials" | "footer" | "contact">;

/** ทุกอย่างที่หน้าแก้ไขเนื้อหาและธีมแก้ได้ ทั้งฉบับที่เผยแพร่และฉบับร่าง */
export type Working = { pages: Page[]; design: Design; global: GlobalContent };

export type MediaItem = { src: string; name: string; size: number; when: string; userId: number };
