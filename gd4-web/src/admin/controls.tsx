"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setAdminLang } from "@/app/admin/actions/auth";
import { fadeToggle, useTheme } from "@/components/layout/theme";
import { ADMIN_THEME_KEY } from "@/components/layout/theme-init";
import { AIcon } from "./AIcon";
import { useAdmin } from "./context";

export function AdminLangSwitch({ size = "md" }: { size?: "md" | "lg" }) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (l: "th" | "en") => {
    if (l === lang || pending) return;
    start(async () => {
      await setAdminLang(l);
      router.refresh();
    });
  };
  const w = size === "lg" ? "min-w-11" : "min-w-[42px]";
  return (
    <div role="group" aria-label={t.top.language} className="relative flex flex-none rounded-full border border-line bg-surface p-[3px]">
      <span
        className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-blue-solid transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)]"
        style={{ transform: `translateX(${lang === "en" ? "100%" : "0"})` }}
      />
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => go(l)}
          className={`relative h-[34px] ${w} cursor-pointer rounded-full border-0 bg-transparent text-[13px] font-semibold transition-colors duration-300 ${
            lang === l ? "text-white" : "text-ink2"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function AdminThemeToggle() {
  const { t } = useAdmin();
  const [theme, setTheme] = useTheme(ADMIN_THEME_KEY);
  const dark = theme === "dark";
  const ease = "transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]";
  return (
    <button
      type="button"
      onClick={() => fadeToggle(theme, setTheme)}
      aria-label={t.top.theme}
      title={t.top.theme}
      className="grid size-[42px] flex-none cursor-pointer place-items-center overflow-hidden rounded-full border border-line bg-surface text-ink hover:border-blue-solid hover:text-blue"
    >
      <span className={`[grid-area:1/1] grid ${ease} ${dark ? "rotate-[-90deg] scale-[.4] opacity-0" : ""}`}>
        <AIcon name="sun" />
      </span>
      <span className={`[grid-area:1/1] grid ${ease} ${dark ? "" : "rotate-90 scale-[.4] opacity-0"}`}>
        <AIcon name="moon" />
      </span>
    </button>
  );
}

export function Spinner() {
  return <span className="size-[18px] rounded-full border-2 border-white/35 border-t-white [animation:a-spin_.7s_linear_infinite]" />;
}
