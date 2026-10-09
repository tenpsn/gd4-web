"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { IMG_MAX, validateProduct, type ProductErrors, type ProductInput } from "@/admin/productRules";
import { same } from "@/lib/same";
import { logActivity } from "@/server/activity";
import { assertCan } from "@/server/auth";
import { mutateAndPrune } from "@/server/cleanup";
import { sanitizeHtml } from "@/server/sanitize";
import { mutate, nowStr, readDb } from "@/server/store";
import type { Category, LText, Product } from "@/types/site";

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const ltext = (v: Partial<LText> | undefined, max: number): LText => ({ th: str(v?.th, max), en: str(v?.en, max) });
/** รับเฉพาะรูปที่อัปโหลดในระบบเรา รูปตัวอย่าง หรือไม่มีรูป */
const safeSrc = (s: unknown) => (typeof s === "string" && (/^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s) || s === "placeholder") ? s : null);

function refreshSite() {
  revalidatePath("/", "layout");
}

export type SaveProductResult = { ok: true; id: string } | { ok: false; errors: ProductErrors };

export async function saveProduct(input: ProductInput, status: "pub" | "draft"): Promise<SaveProductResult> {
  const user = await assertCan("products", status === "pub" ? "publish" : "edit");

  // จัดข้อมูลทั้งหมดที่ส่งมาจากเบราว์เซอร์ให้อยู่ในรูปแบบที่ปลอดภัย
  const f: ProductInput = {
    id: input.id ? str(input.id, 64) : null,
    sku: str(input.sku, 40).trim(),
    category: str(input.category, 40),
    status,
    name: ltext(input.name, 200),
    short: ltext(input.short, 400),
    detail: { th: sanitizeHtml(str(input.detail?.th, 20000)), en: sanitizeHtml(str(input.detail?.en, 20000)) },
    images: (Array.isArray(input.images) ? input.images : []).slice(0, IMG_MAX).map((i) => ({ id: str(i.id, 64), src: safeSrc(i.src), label: ltext(i.label, 120) })),
    mainId: input.mainId ? str(input.mainId, 64) : null,
    specs: (Array.isArray(input.specs) ? input.specs : []).slice(0, 50).map((s) => ({ id: str(s.id, 64), k: ltext(s.k, 120), v: str(s.v, 200) })),
    pdf: input.pdf && /^\/media\/[0-9a-f-]{36}\.pdf$/.test(input.pdf.src) ? { name: str(input.pdf.name, 120), size: Number(input.pdf.size) || 0, src: input.pdf.src } : null,
  };

  const db = await readDb();
  if (!db.categories.some((c) => c.id === f.category)) f.category = "";
  const errors = validateProduct(f, db.products);
  if (Object.keys(errors).length) return { ok: false, errors };

  const isNew = !f.id || !db.products.some((p) => p.id === f.id);
  const id = isNew ? randomUUID() : f.id!;
  const main = f.images.find((i) => i.id === f.mainId) ?? f.images[0];
  const record: Product = {
    id, sku: f.sku, name: f.name, short: f.short, detail: f.detail, category: f.category, status,
    img: main?.src ?? null, images: f.images, specs: f.specs.filter((s) => s.k.th || s.k.en || s.v), pdf: f.pdf,
    updatedAt: nowStr(), updatedBy: user.id,
  };

  // รูปเดิมที่ไม่อยู่ในคลังและไม่มีที่ไหนใช้แล้วจะถูกลบ ส่วน PDF ยังเก็บไว้ในคลังไฟล์
  await mutateAndPrune((d) => {
    if (isNew) d.products.unshift(record);
    else d.products = d.products.map((p) => (p.id === id ? record : p));
    logActivity(d, user.id, isNew ? "added" : status === "pub" ? "published" : "edited", record.name);
  });
  refreshSite();
  return { ok: true, id };
}

export async function deleteProducts(ids: string[]): Promise<{ ok: true; count: number }> {
  const user = await assertCan("products", "del");
  const set = new Set(ids.map((x) => String(x)));
  const count = await mutateAndPrune((d) => {
    const gone = d.products.filter((p) => set.has(p.id));
    d.products = d.products.filter((p) => !set.has(p.id));
    gone.forEach((p) => logActivity(d, user.id, "deleted", p.name));
    return gone.length;
  });
  refreshSite();
  return { ok: true, count };
}

export type CategoryResult = { ok: true; categories: Category[] } | { ok: false; error: "errBoth" | "catInUse" };

/** บันทึกรายการหมวดหมู่ทั้งหมดในครั้งเดียว ทั้งลำดับ ชื่อ การเพิ่ม และการลบ */
export async function saveCategories(list: Category[]): Promise<CategoryResult> {
  const me = await assertCan("products", "edit");
  const clean = (Array.isArray(list) ? list : []).slice(0, 100).map((c) => ({
    id: str(c.id, 40) || randomUUID().slice(0, 8),
    name: { th: str(c.name?.th, 80).trim(), en: str(c.name?.en, 80).trim() },
  }));
  if (clean.some((c) => !c.name.th || !c.name.en)) return { ok: false, error: "errBoth" };
  const db = await readDb();
  const kept = new Set(clean.map((c) => c.id));
  if (db.products.some((p) => p.category && !kept.has(p.category) && db.categories.some((c) => c.id === p.category))) {
    return { ok: false, error: "catInUse" };
  }
  await mutate((d) => {
    if (!same(d.categories, clean)) logActivity(d, me.id, { th: "แก้หมวดหมู่สินค้า", en: "updated categories" }, { th: `${clean.length} หมวดหมู่`, en: `${clean.length} categories` });
    d.categories = clean;
  });
  refreshSite();
  return { ok: true, categories: clean };
}
