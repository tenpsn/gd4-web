"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { logout } from "@/app/admin/actions/auth";
import type { Area, PublicUser } from "@/server/types";
import { AIcon, type AIconName } from "./AIcon";
import { avatarColor } from "./avatar";
import { useAdmin } from "./context";
import { AdminLangSwitch, AdminThemeToggle } from "./controls";
import { Confirm, isDirty, PUBBAR_SLOT, ToastProvider } from "./ui";

const NAV: { area: Area; href: string; icon: AIconName }[] = [
  { area: "dashboard", href: "/admin", icon: "dash" },
  { area: "products", href: "/admin/products", icon: "box" },
  { area: "content", href: "/admin/content", icon: "page" },
  { area: "design", href: "/admin/design", icon: "text" },
  { area: "inbox", href: "/admin/inbox", icon: "inbox" },
  { area: "users", href: "/admin/users", icon: "users" },
  { area: "settings", href: "/admin/settings", icon: "gear" },
];

const COLLAPSE_KEY = "admin-side-collapsed";

// จำว่าผู้ใช้ย่อแถบเมนูด้านข้างไว้หรือไม่ เก็บไว้ในเบราว์เซอร์
const listeners = new Set<() => void>();
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeCollapsed = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const setCollapsedPref = (v: boolean) => {
  try {
    localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
};

export function AdminShell({ user, areas, newMessages, children }: {
  user: PublicUser;
  /** ส่วนที่ผู้ใช้คนนี้มีสิทธิ์เข้าดู */
  areas: Area[];
  newMessages: number;
  children: React.ReactNode;
}) {
  const { lang, t } = useAdmin();
  const path = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [q, setQ] = useState("");
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  // ถามก่อนออกจากหน้าที่ยังไม่ได้บันทึก เมื่อกดลิงก์ภายในหน้าแอดมิน
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isDirty() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (!a || !href || !href.startsWith("/admin") || a.target === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // ปิดเมนูสไลด์เมื่อเปลี่ยนหน้า
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setDrawer(false);
  }

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  const items = NAV.filter((n) => areas.includes(n.area));

  // ชื่อเมนูแสดงเสมอบนมือถือ ซ่อนบนแท็บเล็ต และแสดงบนคอมพิวเตอร์ถ้าไม่ได้ย่อแถบเมนู
  const labelCls = `md2:hidden ${collapsed ? "" : "xl2:inline"}`;

  return (
    <ToastProvider>
    <div className="relative flex h-dvh">
      {drawer && <div onClick={() => setDrawer(false)} className="absolute inset-0 z-[39] bg-[var(--overlay)] [animation:a-fade_.3s_both] md2:hidden" />}

      <aside
        className={`absolute inset-y-0 left-0 z-40 flex w-[284px] flex-none flex-col overflow-hidden bg-side text-side-ink transition-[width,transform] duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] md2:relative md2:w-[76px] md2:translate-x-0 md2:shadow-none ${
          collapsed ? "" : "xl2:w-[252px]"
        } ${drawer ? "translate-x-0 shadow-[0_20px_60px_rgba(0,0,0,.45)]" : "-translate-x-[105%]"}`}
      >
        <div className="flex h-16 flex-none items-center gap-3 border-b border-white/[.08] px-4">
          <span className="relative grid size-11 flex-none place-items-center rounded-lg bg-[#2a5fb8] text-[15px] font-bold text-white">
            GD4
            <span className="absolute -right-[3px] -top-[3px] size-2.5 rounded-full border-2 border-side bg-brand-red" />
          </span>
          <span className={`flex min-w-0 flex-1 flex-col whitespace-nowrap leading-[1.2] md2:hidden ${collapsed ? "" : "xl2:flex"}`}>
            <strong className="text-base text-white">GD4 Medical</strong>
            <span className="text-[12.5px] text-side-ink2">{t.nav.admin}</span>
          </span>
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label={t.c.close}
            className="grid size-11 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-side-ink md2:hidden"
          >
            <AIcon name="x" />
          </button>
        </div>

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-auto px-3 py-3.5">
          {items.map((n, i) => {
            const on = active(n.href);
            const label = t.nav[n.area];
            return (
              <Link
                key={n.area}
                href={n.href}
                title={label}
                aria-current={on ? "page" : undefined}
                style={drawer ? { animation: `a-up .45s cubic-bezier(.2,.7,.2,1) ${(0.08 + i * 0.05).toFixed(2)}s both` } : undefined}
                className={`relative flex min-h-[46px] items-center gap-3 rounded-lg px-3.5 text-[15px] transition-colors duration-200 hover:text-white ${
                  on ? "bg-white/10 font-semibold text-white" : "font-medium text-side-ink"
                }`}
              >
                <span
                  className={`absolute inset-y-2.5 left-0 w-[3px] rounded-r-[3px] bg-brand-red transition-transform duration-300 ${on ? "scale-y-100" : "scale-y-0"}`}
                />
                <AIcon name={n.icon} size={20} />
                <span className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${labelCls}`}>{label}</span>
                {n.area === "inbox" && newMessages > 0 && (
                  <span
                    className={`grid h-5 min-w-5 place-items-center rounded-[10px] bg-brand-red px-1.5 text-xs font-bold text-white md2:absolute md2:right-2 md2:top-[5px] ${
                      collapsed ? "" : "xl2:static"
                    }`}
                  >
                    {newMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-white/[.08] p-3">
          <button
            type="button"
            onClick={() => setCollapsedPref(!collapsed)}
            title={collapsed ? t.nav.expand : t.nav.collapse}
            className="hidden min-h-11 cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3.5 text-left text-[14.5px] text-side-ink2 transition-colors hover:bg-white/[.06] hover:text-white xl2:flex"
          >
            <span className={`grid transition-transform duration-[350ms] ${collapsed ? "rotate-180" : ""}`}>
              <AIcon name="side" />
            </span>
            {!collapsed && <span className="whitespace-nowrap">{t.nav.collapse}</span>}
          </button>
          <form action={logout}>
            <button
              type="submit"
              title={t.nav.logout}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3.5 text-left text-[14.5px] font-medium text-[#ffb1a8] transition-colors hover:bg-[rgba(232,72,61,.14)]"
            >
              <AIcon name="logout" />
              <span className={`whitespace-nowrap ${labelCls}`}>{t.nav.logout}</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="relative z-[5] flex h-16 flex-none items-center gap-2.5 border-b border-line bg-surface px-3 md2:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={t.top.menu}
            aria-expanded={drawer}
            className="grid size-11 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink md2:hidden"
          >
            <AIcon name="menu" />
          </button>
          <span className="grid size-9 place-items-center rounded-lg bg-blue-solid text-[12.5px] font-bold text-white md2:hidden">GD4</span>
          {areas.includes("products") && (
            <form
              role="search"
              className="relative hidden max-w-[440px] flex-1 md2:block"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/admin/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
              }}
            >
              <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 text-ink3">
                <AIcon name="search" />
              </span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.top.search}
                aria-label={t.top.search}
                className="h-[42px] w-full rounded-lg border border-transparent bg-bg pl-10 pr-3.5 text-[14.5px] text-ink outline-none transition-[border-color,box-shadow,background-color] focus:border-blue-solid focus:bg-field focus:shadow-[0_0_0_3px_var(--soft)]"
              />
            </form>
          )}
          <span className="flex-1" />
          <AdminLangSwitch />
          <AdminThemeToggle />
          <Link
            href="/admin/settings"
            className="flex items-center gap-2.5 rounded-full p-[3px] text-left text-ink hover:text-ink"
          >
            <span className="grid size-[38px] flex-none place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: avatarColor(user.id) }}>
              {user.ini[lang]}
            </span>
            <span className="hidden flex-col pr-1.5 leading-[1.25] xl2:flex">
              <strong className="text-sm font-semibold">{user.name[lang]}</strong>
              <span className="text-[12.5px] text-ink2">{t.roles[user.role]}</span>
            </span>
          </Link>
        </header>

        <div id={PUBBAR_SLOT} className="contents" />
        <main className="flex-1 overflow-auto px-4 pb-7 pt-4 md2:p-7">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-[22px]">{children}</div>
        </main>
      </div>
    </div>
    <Confirm
      open={!!leaveTo}
      onClose={() => setLeaveTo(null)}
      onOk={() => {
        const to = leaveTo!;
        setLeaveTo(null);
        window.dispatchEvent(new Event("admin:discard"));
        router.push(to);
      }}
      title={t.cf.leaveTitle}
      text={t.cf.leaveText}
      okLabel={t.cf.leave}
      cancelLabel={t.cf.stay}
      danger={false}
      icon="alert"
    />
    </ToastProvider>
  );
}
