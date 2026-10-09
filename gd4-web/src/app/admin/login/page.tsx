import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AIcon } from "@/admin/AIcon";
import { AdminLangSwitch, AdminThemeToggle } from "@/admin/controls";
import { getAdminDict } from "@/admin/i18n";
import { BrandMark } from "@/admin/Brand";
import { getBrand } from "@/admin/brand.server";
import { getAdminLang } from "@/admin/server";
import { getCurrentUser } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const t = getAdminDict(await getAdminLang());
  const brand = await getBrand();

  return (
    <div className="flex min-h-full bg-bg">
      {/* แผงแสดงแบรนด์ แสดงเฉพาะจอกว้าง */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-panel p-12 text-white min-[900px]:flex">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-brand-red" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.035)_0_2px,transparent_2px_26px)]" />
        <div className="relative flex items-center gap-3">
          <BrandMark brand={brand} onDark />
          <span className="flex flex-col leading-[1.2]">
            <strong className="text-[17px]">{brand.name}</strong>
            <span className="text-[13px] text-on-panel2">{t.nav.admin}</span>
          </span>
        </div>
        <div className="relative flex max-w-[460px] flex-col gap-[18px] [animation:a-up_.7s_cubic-bezier(.2,.7,.2,1)_.1s_both]">
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-on-panel2">
            <span className="h-[3px] w-7 rounded-sm bg-brand-red" />
            {t.login.panelEyebrow}
          </span>
          <h2 className="m-0 text-[40px] font-bold leading-[1.2] text-balance">{t.login.panelTitle}</h2>
          <p className="m-0 text-[17px] leading-[1.7] text-pretty text-on-panel2">{t.login.panelText}</p>
        </div>
        <span className="relative flex items-center gap-2 text-[13.5px] text-on-panel2">
          <AIcon name="lock" />
          {t.login.secure}
        </span>
      </div>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <span className="flex items-center gap-2.5 min-[900px]:hidden">
            <BrandMark brand={brand} size="size-10" />
            <strong className="text-base">{brand.name}</strong>
          </span>
          <span className="flex-1" />
          <AdminLangSwitch size="lg" />
          <AdminThemeToggle />
        </div>
        <div className="grid flex-1 place-items-center px-5 pb-14 pt-4">
          <div className="flex w-full max-w-[400px] flex-col gap-[26px] [animation:a-up_.6s_cubic-bezier(.2,.7,.2,1)_both]">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
