"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { href as localize } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

/** ลิงก์ที่เติมรหัสภาษาปัจจุบันให้อัตโนมัติ ส่วนลิงก์เบอร์โทร อีเมล และเว็บภายนอกใช้ลิงก์ธรรมดา */
export function LocalLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { lang } = useI18n();
  if (!href.startsWith("/")) {
    const external = /^https?:/.test(href);
    return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest} />;
  }
  return <Link href={localize(href, lang)} {...rest} />;
}
