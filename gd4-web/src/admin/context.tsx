"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/types/site";
import { getAdminDict, type AdminDict } from "./i18n";

const Ctx = createContext<Locale>("th");

export function AdminLangProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useAdmin(): { lang: Locale; t: AdminDict } {
  const lang = useContext(Ctx);
  return { lang, t: getAdminDict(lang) };
}
