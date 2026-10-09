/** กฎตรวจฟอร์มสินค้า ใช้ร่วมกันทั้งในฟอร์มและฝั่งเซิร์ฟเวอร์ */
import type { LText, Product, ProductImage } from "@/types/site";

export type ProductInput = {
  id: string | null;
  sku: string;
  category: string;
  status: "pub" | "draft";
  name: LText;
  short: LText;
  detail: LText;
  images: ProductImage[];
  mainId: string | null;
  specs: { id: string; k: LText; v: string }[];
  pdf: Product["pdf"];
};

export type ProductErrKey = "errName" | "errShort" | "errSkuReq" | "errSku" | "errSkuDup" | "errCat";
export type ProductErrors = Partial<Record<"name_th" | "name_en" | "short_th" | "short_en" | "sku" | "cat", ProductErrKey>>;

export const SHORT_MAX = 160;
/** จำนวนรูปสูงสุดต่อสินค้า */
export const IMG_MAX = 20;

export function validateProduct(f: ProductInput, others: { id: string; sku: string }[]): ProductErrors {
  const e: ProductErrors = {};
  for (const l of ["th", "en"] as const) {
    if (!f.name[l].trim()) e[`name_${l}`] = "errName";
    if (f.short[l].length > SHORT_MAX) e[`short_${l}`] = "errShort";
  }
  const sku = f.sku.trim();
  if (!sku) e.sku = "errSkuReq";
  else if (!/^[A-Za-z0-9-]+$/.test(sku)) e.sku = "errSku";
  else if (others.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== f.id)) e.sku = "errSkuDup";
  if (!f.category) e.cat = "errCat";
  return e;
}

export function toInput(p: Product | null): ProductInput {
  if (!p) {
    return {
      id: null, sku: "", category: "", status: "draft", name: { th: "", en: "" }, short: { th: "", en: "" }, detail: { th: "", en: "" },
      images: [], mainId: null, specs: [{ id: "sp1", k: { th: "", en: "" }, v: "" }], pdf: null,
    };
  }
  const images = p.images ?? (p.img ? [{ id: "img1", src: p.img, label: { th: p.sku, en: p.sku } }] : []);
  return {
    id: p.id, sku: p.sku, category: p.category, status: p.status, name: { ...p.name },
    short: p.short ?? { th: "", en: "" }, detail: p.detail ?? { th: "", en: "" }, images,
    mainId: images.find((i) => i.src === p.img)?.id ?? images[0]?.id ?? null,
    specs: (p.specs ?? []).map((s, i) => ({ id: s.id ?? `sp${i + 1}`, k: { ...s.k }, v: s.v })),
    pdf: p.pdf ?? null,
  };
}
