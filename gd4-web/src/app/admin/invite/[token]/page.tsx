import type { Metadata } from "next";
import { BrandMark } from "@/admin/Brand";
import { getBrand } from "@/admin/brand.server";
import { AdminLangSwitch, AdminThemeToggle } from "@/admin/controls";
import { InviteForm } from "./InviteForm";

export const metadata: Metadata = { title: "Set your password" };

/** หน้าลิงก์เชิญ ผู้ดูแลคนใหม่ตั้งรหัสผ่านแล้วเข้าสู่ระบบ */
export default async function InvitePage({ params }: PageProps<"/admin/invite/[token]">) {
  const { token } = await params;
  const brand = await getBrand();
  return (
    <div className="flex min-h-full flex-col bg-bg">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <BrandMark brand={brand} size="size-10" />
        <strong className="text-base">{brand.name}</strong>
        <span className="flex-1" />
        <AdminLangSwitch size="lg" />
        <AdminThemeToggle />
      </div>
      <div className="grid flex-1 place-items-center px-5 pb-14 pt-4">
        <div className="flex w-full max-w-[400px] flex-col gap-[26px] anim-up">
          <InviteForm token={token} />
        </div>
      </div>
    </div>
  );
}
