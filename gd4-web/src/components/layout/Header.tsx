"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { href, stripLocale, tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Img, Locale, MenuItem } from "@/types/site";
import { useTheme } from "./theme";

/* จำนวนเมนูที่แสดงตามความกว้างจอ ต่ำกว่า 1180px แสดง 5 ถึง 1360px แสดง 6 กว้างกว่านั้นแสดง 7
 * ถ้ามีมากกว่านั้น ช่องสุดท้ายจะกลายเป็นเมนูเพิ่มเติม ทำด้วย CSS เพื่อไม่ให้หน้ากระพริบ */
const SLOTS = [
  { max: 5, show: "lg:flex", hide: "lg:hidden" },
  { max: 6, show: "quote:flex", hide: "quote:hidden" },
  { max: 7, show: "wide:flex", hide: "wide:hidden" },
];
const visibleCount = (total: number, max: number) => (total <= max ? total : max - 1);

function isActive(path: string, url: string) {
  const u = url.split(/[?#]/)[0];
  return u === "/" ? path === "/" : path === u || path.startsWith(u + "/");
}

export function Header({ menu, siteName, logo, logoDark }: { menu: MenuItem[]; siteName: string; logo?: Img; logoDark?: Img }) {
  const { lang, t } = useI18n();
  const path = stripLocale(usePathname());
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [drawerSub, setDrawerSub] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // ปิดเมนูทั้งหมดเมื่อเปลี่ยนหน้า
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(null);
    setDrawer(false);
    setDrawerSub(null);
  }

  // ปิดเมนูย่อยเมื่อคลิกข้างนอกหรือกดปุ่ม Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // เมนูมือถือ ล็อกไม่ให้หน้าเลื่อน และปิดเมื่อกด Escape หรือขยายจอเป็นขนาดคอมพิวเตอร์
  useEffect(() => {
    if (!drawer) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setDrawer(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [drawer]);

  const total = menu.length;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg shadow-[0_8px_20px_-18px_rgba(0,0,0,.4)]">
      {/* บนมือถือลดระยะห่างลง ให้โลโก้ ปุ่มภาษา ปุ่มธีม และเมนูพอดีจอกว้าง 360px */}
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center gap-2 px-4 sm:gap-5 sm:px-[var(--sec-px)]">
        <LocalLink href="/" aria-label={siteName} className="flex flex-none items-center gap-2.5 text-ink hover:text-ink">
          {logo && logo !== "placeholder" && (
            <>
              {/* โลโก้ที่อัปโหลดจากหน้าตั้งค่า ถ้าไม่มีโลโก้โหมดมืดจะใช้โลโก้โหมดสว่างแทน ชื่อเว็บแสดงเป็นตัวอักษรข้าง ๆ แล้ว รูปจึงไม่ต้องมีคำอธิบาย */}
              {/* eslint-disable-next-line @next/next/no-img-element -- โลโก้ต้องคงสัดส่วนเดิมของรูป */}
              <img src={logo} alt="" className={`h-11 w-auto max-w-[200px] object-contain ${logoDark && logoDark !== "placeholder" ? "dark:hidden" : ""}`} />
              {logoDark && logoDark !== "placeholder" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDark} alt="" className="hidden h-11 w-auto max-w-[200px] object-contain dark:block" />
              )}
            </>
          )}
          {/* ชื่อเว็บแสดงคู่กับโลโก้เสมอ ถ้ามีโลโก้และจอแคบมาก ซ่อนชื่อเพื่อให้ปุ่มด้านขวาพอดี */}
          <strong className={`whitespace-nowrap font-head text-[17px] ${logo && logo !== "placeholder" ? "max-[399px]:hidden" : ""}`}>{siteName}</strong>
        </LocalLink>
        <span className="flex-1" />

        <nav ref={navRef} aria-label="Main" className="hidden h-full items-center gap-1 lg:flex">
          {menu.map((m, i) => {
            const cls = SLOTS.map((s) => (i < visibleCount(total, s.max) ? s.show : s.hide)).join(" ");
            return (
              <NavItem
                key={m.id}
                item={m}
                lang={lang}
                className={cls}
                active={isActive(path, m.url)}
                open={open === m.id}
                setOpen={(v) => setOpen(v ? m.id : null)}
              />
            );
          })}
          {total > SLOTS[0].max && (
            <MoreMenu
              menu={menu}
              lang={lang}
              label={t.more}
              open={open === "__more"}
              setOpen={(v) => setOpen(v ? "__more" : null)}
            />
          )}
        </nav>

        <LangSwitch lang={lang} path={path} label={t.language} />
        <ThemeToggle label={t.theme} />

        <LocalLink
          href="/contact"
          className="hidden flex-none items-center gap-2 whitespace-nowrap rounded-btn bg-accent-solid px-[18px] py-[11px] text-btn font-semibold text-white hover:text-white hover:brightness-110 quote:inline-flex"
        >
          {t.quote}
        </LocalLink>

        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label={t.openMenu}
          aria-expanded={drawer}
          className="grid size-11 flex-none cursor-pointer place-items-center rounded-ctl text-ink lg:hidden"
        >
          <Icon name="menu" />
        </button>
      </div>

      {drawer && (
        <Drawer
          menu={menu}
          lang={lang}
          siteName={siteName}
          path={path}
          sub={drawerSub}
          setSub={setDrawerSub}
          onClose={() => {
            setDrawer(false);
            setDrawerSub(null);
          }}
          quote={t.quote}
          closeLabel={t.close}
        />
      )}
      <ScrollProgress />
    </header>
  );
}

/** แถบสีแดงใต้เมนูด้านบน ยาวขึ้นตามที่เลื่อนหน้าลงไป และหดลงเมื่อเลื่อนขึ้น */
function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    // แก้ความยาวของแถบตรง ๆ ไม่ต้องวาดส่วนหัวทั้งหมดใหม่ทุกครั้งที่เลื่อน
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-px h-[3px]">
      <span ref={bar} className="block h-full origin-left bg-accent-solid" style={{ transform: "scaleX(0)" }} />
    </span>
  );
}

function NavItem({ item, lang, className, active, open, setOpen }: {
  item: MenuItem;
  lang: Locale;
  className: string;
  active: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const kids = item.children ?? [];
  const linkCls = `relative inline-flex items-center gap-1 whitespace-nowrap rounded-ctl px-3 py-2.5 text-menu font-medium transition-colors hover:text-primary ${
    active ? "text-primary" : "text-ink"
  }`;
  const bar = (
    <span
      className={`absolute inset-x-3 bottom-0.5 h-0.5 rounded-sm bg-accent-solid transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`}
    />
  );

  if (!kids.length) {
    return (
      <div className={`relative hidden h-full items-center ${className}`}>
        <LocalLink href={item.url} className={linkCls} aria-current={active ? "page" : undefined}>
          {tx(item.label, lang)}
          {bar}
        </LocalLink>
      </div>
    );
  }

  const wide = kids.length > 4;
  return (
    <div
      className={`relative hidden h-full items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`${linkCls} cursor-pointer border-0 bg-transparent`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
      >
        {tx(item.label, lang)}
        <span className={`grid transition-transform duration-[250ms] ${open ? "rotate-180" : ""}`}>
          <Icon name="chevD" size={16} />
        </span>
        {bar}
      </button>
      {open && (
        <div
          className={`absolute left-0 top-[calc(100%-6px)] grid gap-0.5 rounded-card border border-line bg-card p-2 shadow-card [animation:s-drop_.22s_cubic-bezier(.2,.7,.2,1)_both] ${
            wide ? "w-[440px] grid-cols-2" : "w-60 grid-cols-1"
          }`}
        >
          {kids.map((k) => (
            <LocalLink
              key={k.id}
              href={k.url}
              onClick={() => setOpen(false)}
              className="block rounded-ctl px-3 py-2.5 text-[calc(var(--fs-menu)*.97)] leading-[1.4] text-ink hover:bg-soft hover:text-primary"
            >
              {tx(k.label, lang)}
            </LocalLink>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreMenu({ menu, lang, label, open, setOpen }: {
  menu: MenuItem[];
  lang: Locale;
  label: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const total = menu.length;
  // แสดงปุ่มเพิ่มเติมเฉพาะความกว้างที่เมนูล้นแถบ
  const wrapCls = SLOTS.map((s) => (total > s.max ? s.show : s.hide)).join(" ");
  return (
    <div
      className={`relative hidden h-full items-center ${wrapCls}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border-0 bg-transparent px-3 py-2.5 text-menu font-medium text-ink"
      >
        {label}
        <span className={`grid transition-transform duration-[250ms] ${open ? "rotate-180" : ""}`}>
          <Icon name="chevD" size={16} />
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%-6px)] flex w-[260px] flex-col gap-0.5 rounded-card border border-line bg-card p-2 shadow-card [animation:s-drop_.22s_both]">
          {menu.map((m, i) => {
            // เมนูที่ไม่แสดงบนแถบในความกว้างนั้น จะย้ายมาอยู่ในเมนูเพิ่มเติม
            const cls = SLOTS.map((s) => (total > s.max && i >= visibleCount(total, s.max) ? s.show : s.hide)).join(" ");
            return (
              <LocalLink
                key={m.id}
                href={m.url}
                onClick={() => setOpen(false)}
                className={`hidden rounded-ctl px-3 py-2.5 text-[calc(var(--fs-menu)*.97)] text-ink hover:bg-soft hover:text-primary ${cls}`}
              >
                {tx(m.label, lang)}
              </LocalLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LangSwitch({ lang, path, label }: { lang: Locale; path: string; label: string }) {
  const router = useRouter();
  const go = (to: Locale) => {
    if (to === lang) return;
    router.push(href(path, to) + window.location.search + window.location.hash);
  };
  return (
    <div role="group" aria-label={label} className="relative flex flex-none rounded-full border border-line p-[3px]">
      <span
        className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-primary-solid transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)]"
        style={{ transform: `translateX(${lang === "en" ? "100%" : "0"})` }}
      />
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => go(l)}
          className={`relative h-8 min-w-10 cursor-pointer rounded-full border-0 bg-transparent text-[13px] font-semibold transition-colors duration-300 ${
            lang === l ? "text-white" : "text-ink2"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle({ label }: { label: string }) {
  // ตอนสร้างหน้าบนเซิร์ฟเวอร์ยังไม่รู้ธีม จึงแสดงแบบสว่างไว้ก่อนจนหน้าโหลดเสร็จ
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";
  const toggle = () => {
    const root = document.documentElement;
    root.dataset.fade = "1";
    setTheme(dark ? "light" : "dark");
    window.setTimeout(() => delete root.dataset.fade, 420);
  };
  const ease = "transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="grid size-10 flex-none cursor-pointer place-items-center overflow-hidden rounded-full border border-line bg-transparent text-ink"
    >
      <span className={`[grid-area:1/1] grid ${ease} ${dark ? "rotate-[-90deg] scale-[.4] opacity-0" : ""}`}>
        <Icon name="sun" />
      </span>
      <span className={`[grid-area:1/1] grid ${ease} ${dark ? "" : "rotate-90 scale-[.4] opacity-0"}`}>
        <Icon name="moon" />
      </span>
    </button>
  );
}

function Drawer({ menu, lang, siteName, path, sub, setSub, onClose, quote, closeLabel }: {
  menu: MenuItem[];
  lang: Locale;
  siteName: string;
  path: string;
  sub: string | null;
  setSub: (v: string | null) => void;
  onClose: () => void;
  quote: string;
  closeLabel: string;
}) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-[rgba(5,10,20,.55)] [animation:s-fade_.25s_both]" />
      <aside
        aria-label="Menu"
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-[41] flex w-[min(360px,88%)] flex-col bg-bg text-ink shadow-[-20px_0_60px_-20px_rgba(0,0,0,.5)] [animation:s-drawer_.4s_cubic-bezier(.2,.7,.2,1)_both]"
      >
        <div className="flex h-[72px] flex-none items-center justify-between border-b border-line pl-5 pr-3">
          <strong className="font-head text-[17px]">{siteName}</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            autoFocus
            className="grid size-11 cursor-pointer place-items-center rounded-ctl border-0 bg-transparent text-ink"
          >
            <Icon name="x" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col overflow-auto px-3 py-2.5">
          {menu.map((m, i) => {
            const kids = m.children ?? [];
            const active = isActive(path, m.url);
            const openSub = sub === m.id;
            const rowCls = `flex min-h-[54px] w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-2 text-left text-menu font-medium ${
              active ? "text-primary" : "text-ink"
            }`;
            return (
              <div key={m.id} className="anim-up border-b border-line" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
                {kids.length ? (
                  <button type="button" className={rowCls} aria-expanded={openSub} onClick={() => setSub(openSub ? null : m.id)}>
                    <span className="flex-1">{tx(m.label, lang)}</span>
                    <span className={`grid text-ink2 transition-transform duration-300 ${openSub ? "rotate-180" : ""}`}>
                      <Icon name="chevD" />
                    </span>
                  </button>
                ) : (
                  <LocalLink href={m.url} onClick={onClose} className={`${rowCls} hover:text-primary`}>
                    <span className="flex-1">{tx(m.label, lang)}</span>
                  </LocalLink>
                )}
                {openSub && (
                  <div className="flex flex-col pb-2.5 pl-3 [animation:s-up_.25s_both]">
                    {kids.map((k) => (
                      <LocalLink
                        key={k.id}
                        href={k.url}
                        onClick={onClose}
                        className="flex min-h-11 items-center rounded-ctl px-2.5 text-[calc(var(--fs-menu)*.94)] text-ink2 hover:bg-soft hover:text-primary"
                      >
                        {tx(k.label, lang)}
                      </LocalLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line px-5 pb-5 pt-4">
          <LocalLink
            href="/contact"
            onClick={onClose}
            className="flex min-h-[50px] items-center justify-center whitespace-nowrap rounded-btn bg-accent-solid text-btn font-semibold text-white hover:text-white"
          >
            {quote}
          </LocalLink>
        </div>
      </aside>
    </>
  );
}
