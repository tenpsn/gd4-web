/**
 * โครงสร้างข้อมูลฝั่งหลังบ้าน ตามต้นแบบหน้าแอดมิน
 * ต่อไปจะกลายเป็นตารางในฐานข้อมูล PostgreSQL
 */
import type { Category, Design, LText, Page, Product, SiteSettings } from "@/types/site";

export type Role = "super" | "editor" | "products" | "viewer";
export const ROLES: Role[] = ["super", "editor", "products", "viewer"];

export type Area = "dashboard" | "products" | "content" | "design" | "inbox" | "users" | "settings";
export const AREAS: Area[] = ["dashboard", "products", "content", "design", "inbox", "users", "settings"];

export type Action = "view" | "edit" | "del" | "publish";
export const ACTIONS: Action[] = ["view", "edit", "del", "publish"];

export type Perms = Record<Role, Record<Area, Record<Action, boolean>>>;

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
};

/** ข้อมูลผู้ใช้ที่ส่งไปหน้าเว็บได้อย่างปลอดภัย */
export type PublicUser = Omit<AdminUser, "passwordHash" | "inviteHash" | "inviteExpires">;

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
  backups: Backup[];
  /** รูปภาพที่อัปโหลดไว้ในคลังรูป */
  media: MediaItem[];
  design: Design;
  /** ฉบับที่เคยเผยแพร่ของหน้าและดีไซน์ เรียงจากใหม่ไปเก่า ใช้สำหรับย้อนกลับฉบับเดิม */
  versions: Version[];
  /** งานแก้ไขที่ยังไม่เผยแพร่ เป็น null ถ้าไม่มีงานค้าง */
  draft: (Working & { userId: number; when: string }) | null;
  /** เลขรุ่นงานร่างที่เพิ่มทุกครั้งที่มีการเปลี่ยน ใช้ตรวจว่ามีคนแก้ทับกันหรือไม่ */
  draftRev: number;
};

/** ส่วนที่ใช้ทั้งเว็บ ซึ่งแก้ได้ในแท็บทั้งเว็บของหน้าแก้ไขเนื้อหา */
export type GlobalContent = Pick<SiteSettings, "menu" | "socials" | "footer" | "contact">;

/** ทุกอย่างที่หน้าแก้ไขเนื้อหาและธีมแก้ได้ ทั้งฉบับที่เผยแพร่และฉบับร่าง */
export type Working = { pages: Page[]; design: Design; global: GlobalContent };

export type Version = { v: number; when: string; userId: number; note: LText } & Working;

export type MediaItem = { src: string; name: string; size: number; when: string; userId: number };

export type Backup = { id: string; when: string; size: number; auto: boolean; userId?: number };
