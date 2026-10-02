import type { Metadata } from "next";
import { toInput } from "@/admin/productRules";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const user = await requireUser("products", "edit");
  const db = readDb();
  return (
    <ProductForm
      initial={toInput(null)}
      categories={db.categories}
      others={db.products.map(({ id, sku }) => ({ id, sku }))}
      meta={null}
      canEdit
      canPublish={can(user, "products", "publish")}
      canDel={false}
    />
  );
}
