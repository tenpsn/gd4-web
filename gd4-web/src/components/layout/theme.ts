"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-init";

export type Theme = "light" | "dark";

function storedOrSystem(key: string): Theme {
  try {
    const t = localStorage.getItem(key);
    if (t === "light" || t === "dark") return t;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** ใส่โหมดสีกลับคืนเมื่อหน้าเว็บถูกวาดใหม่ เช่นหน้าไม่พบ ซึ่งทำให้ค่าเดิมหายไป */
export function ThemeSync({ storageKey = THEME_KEY }: { storageKey?: string }) {
  useLayoutEffect(() => {
    if (!document.documentElement.dataset.theme) document.documentElement.dataset.theme = storedOrSystem(storageKey);
  });
  return null;
}

const subscribers = new Map<string, (cb: () => void) => () => void>();
function subscribeFor(key: string) {
  let fn = subscribers.get(key);
  if (!fn) {
    fn = (cb) => {
      const mo = new MutationObserver(cb);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      // ถ้าผู้ชมยังไม่ได้เลือกโหมดสี ให้เปลี่ยนตามเครื่อง
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onMq = () => {
        if (!localStorage.getItem(key)) document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
      };
      mq.addEventListener("change", onMq);
      return () => {
        mo.disconnect();
        mq.removeEventListener("change", onMq);
      };
    };
    subscribers.set(key, fn);
  }
  return fn;
}

/** โหมดสีตอนนี้ ระหว่างที่หน้ายังโหลดไม่เสร็จจะยังไม่มีค่า */
export function useTheme(key: string = THEME_KEY): [Theme | null, (t: Theme) => void] {
  const theme = useSyncExternalStore(
    subscribeFor(key),
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => null,
  );
  const set = (t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(key, t);
    } catch {
      // โหมดไม่ระบุตัวตนจำค่าไม่ได้ จึงใช้ได้แค่หน้านี้
    }
  };
  return [theme, set];
}

/** สลับโหมดสีพร้อมค่อยๆ เปลี่ยนสี ใช้ทั้งหน้าเว็บและหน้าแอดมิน */
export function fadeToggle(current: Theme | null, set: (t: Theme) => void) {
  const root = document.documentElement;
  root.dataset.fade = "1";
  set(current === "dark" ? "light" : "dark");
  window.setTimeout(() => delete root.dataset.fade, 420);
}
