"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/types/site";
import { getDict, type Dict } from "./dictionary";

const LangContext = createContext<Locale>("th");

export function LangProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** ดึงภาษาปัจจุบันและคำแปลของหน้าจอ สำหรับส่วนที่ทำงานบนเบราว์เซอร์ */
export function useI18n(): { lang: Locale; t: Dict } {
  const lang = useContext(LangContext);
  return { lang, t: getDict(lang) };
}
