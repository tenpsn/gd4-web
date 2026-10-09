import type { Metadata } from "next";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { ProductsList } from "./ProductsList";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const user = await requireUser("products");
  const db = await readDb();
  const sp = await searchParams;
  const users = Object.fromEntries(db.users.map((u) => [u.id, u.name]));
  return (
    <ProductsList
      products={db.products.map(({ id, sku, name, category, status, img, updatedAt, updatedBy }) => ({ id, sku, name, category, status, img, updatedAt, updatedBy }))}
      categories={db.categories}
      users={users}
      initialQ={typeof sp.q === "string" ? sp.q : ""}
      canEdit={can(user, "products", "edit")}
      canDel={can(user, "products", "del")}
    />
  );
}
