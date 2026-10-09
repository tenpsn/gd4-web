import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toInput } from "@/admin/productRules";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const user = await requireUser("products");
  const { id } = await params;
  const db = await readDb();
  const p = db.products.find((x) => x.id === id);
  if (!p) notFound();
  const by = db.users.find((u) => u.id === p.updatedBy);
  return (
    <ProductForm
      // เริ่มฟอร์มใหม่เมื่อเปิดสินค้าตัวอื่น
      key={p.id}
      initial={toInput(p)}
      categories={db.categories}
      others={db.products.map(({ id, sku }) => ({ id, sku }))}
      meta={{ updatedAt: p.updatedAt, byName: by?.name }}
      canEdit={can(user, "products", "edit")}
      canPublish={can(user, "products", "publish")}
      canDel={can(user, "products", "del")}
    />
  );
}
