/**
 * ทุกหน้าของเว็บอ่านเนื้อหาผ่านฟังก์ชันชุดนี้เท่านั้น ซึ่งดึงข้อมูลชุดเดียวกับที่แอดมินแก้ไข
 * ทำเป็นแบบรอผลไว้ก่อน เพื่อตอนย้ายไปใช้ PostgreSQL จะได้ไม่ต้องแก้จุดที่เรียกใช้
 */
import "server-only";
import { readDb } from "@/server/store";
import type { Category, Design, Page, Product, Section, SiteSettings } from "@/types/site";

/** ตัดส่วนและรายการที่แอดมินซ่อนไว้ออก */
export function visible(page: Page): Page {
  return {
    ...page,
    sections: page.sections
      .filter((s) => !s.hidden)
      .map((s) => ("items" in s ? ({ ...s, items: (s.items as { hidden?: boolean }[]).filter((i) => !i.hidden) } as Section) : s)),
  };
}

export async function getSettings(): Promise<SiteSettings> {
  return readDb().settings;
}

export async function getDesign(): Promise<Design> {
  return readDb().design;
}

/** หาหน้าที่แอดมินเพิ่มไว้จากที่อยู่ของหน้า โดยใช้ฉบับที่เผยแพร่แล้ว */
export async function getPageBySlug(slug: string): Promise<Page | undefined> {
  const page = readDb().pages.find((p) => p.slug === slug);
  return page ? visible(page) : undefined;
}

export async function getPage(id: string): Promise<Page | undefined> {
  const page = readDb().pages.find((p) => p.id === id);
  return page ? visible(page) : undefined;
}

export async function getCategories(): Promise<Category[]> {
  return readDb().categories;
}

/** ดึงเฉพาะสินค้าที่เผยแพร่แล้ว */
export async function getProducts(opts: { category?: string; limit?: number } = {}): Promise<Product[]> {
  let list = readDb().products.filter((p) => p.status === "pub");
  if (opts.category && opts.category !== "all") list = list.filter((p) => p.category === opts.category);
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getProduct(sku: string): Promise<Product | undefined> {
  return readDb().products.find((p) => p.status === "pub" && p.sku.toLowerCase() === sku.toLowerCase());
}
