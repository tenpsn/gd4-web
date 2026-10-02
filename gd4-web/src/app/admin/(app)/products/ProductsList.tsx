"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { fmtDate, relDate } from "@/admin/i18n";
import { btn, Confirm, pageTitle, Pill, useToast } from "@/admin/ui";
import type { Category, LText, Product } from "@/types/site";
import { deleteProducts } from "../../actions/products";
import { CategoriesModal } from "./CategoriesModal";

type Row = Pick<Product, "id" | "sku" | "name" | "category" | "status" | "img" | "updatedAt" | "updatedBy">;
const PER = 8;
const VIEW_KEY = "admin-products-view";

const viewSubs = new Set<() => void>();
const readView = (): "table" | "cards" => {
  try {
    return localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "table";
  } catch {
    return "table";
  }
};
const setView = (v: "table" | "cards") => {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {}
  viewSubs.forEach((f) => f());
};

/** รูปย่อสินค้า ใช้รูปที่อัปโหลด หรือภาพลายทางพร้อมรหัสสินค้าถ้ายังไม่มีรูป */
export function Thumb({ img, sku, className, text = "text-[10px]" }: { img: Product["img"]; sku: string; className: string; text?: string }) {
  const real = img && img !== "placeholder";
  return (
    <span
      className={`grid place-items-center border border-line bg-cover bg-center font-mono font-medium text-ph-ink ${text} ${className}`}
      style={{ backgroundImage: real ? `url(${img})` : "repeating-linear-gradient(135deg,var(--ph1) 0 6px,var(--ph2) 6px 12px)" }}
    >
      {!real && sku}
    </span>
  );
}

export function ProductsList({ products, categories, users, initialQ, canEdit, canDel }: {
  products: Row[];
  categories: Category[];
  users: Record<number, LText>;
  initialQ: string;
  canEdit: boolean;
  canDel: boolean;
}) {
  const { lang, t } = useAdmin();
  const ol = lang === "th" ? "en" : "th";
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [pending, start] = useTransition();
  const view = useSyncExternalStore((f) => (viewSubs.add(f), () => viewSubs.delete(f)), readView, () => "table" as const);

  // เมื่อค้นหาจากแถบด้านบน ให้ใช้คำค้นนั้นในหน้านี้ด้วย
  const [lastQ, setLastQ] = useState(initialQ);
  if (initialQ !== lastQ) {
    setLastQ(initialQ);
    setQ(initialQ);
    setPage(1);
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name[lang] ?? "—";
  const term = q.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (status === "all" || p.status === status) &&
      (!term || p.name.th.toLowerCase().includes(term) || p.name.en.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages);
  const items = filtered.slice((cur - 1) * PER, cur * PER);
  const isFiltered = !!term || cat !== "all" || status !== "all";
  const allChecked = items.length > 0 && items.every((p) => sel.includes(p.id));

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const clearFilters = () => {
    setQ("");
    setCat("all");
    setStatus("all");
    setPage(1);
  };

  const doDelete = (ids: string[]) =>
    start(async () => {
      try {
        const res = await deleteProducts(ids);
        setSel((s) => s.filter((x) => !ids.includes(x)));
        setConfirm(null);
        toast("ok", `${t.toast.deleted} (${res.count})`);
        router.refresh();
      } catch {
        toast("err", t.toast.fix);
      }
    });

  const st = (s: Row["status"]) => (s === "pub" ? <Pill tone="green">{t.prod.pub}</Pill> : <Pill tone="amber">{t.prod.draft}</Pill>);
  const by = (id?: number) => (id ? users[id]?.[lang] ?? "—" : "—");
  const editHref = (p: Row) => `/admin/products/${p.id}`;
  const check = (p: Row, size = "size-[18px]") =>
    canDel && (
      <input
        type="checkbox"
        checked={sel.includes(p.id)}
        onChange={() => toggle(p.id)}
        aria-label={p.name[lang]}
        className={`${size} block cursor-pointer accent-[var(--blue-solid)]`}
      />
    );
  const actions = (p: Row) => (
    <>
      <Link href={editHref(p)} aria-label={t.c.edit} title={t.c.edit} className={btn.icon}>
        <AIcon name="edit" />
      </Link>
      {canDel && (
        <button type="button" onClick={() => setConfirm([p.id])} aria-label={t.c.del} title={t.c.del} className={btn.iconDanger}>
          <AIcon name="trash" />
        </button>
      )}
    </>
  );

  const selectCls = "min-h-11 cursor-pointer rounded-lg border border-line bg-field px-3 text-[15px] text-ink outline-none focus:border-blue-solid";

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="anim-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className={pageTitle}>{t.prod.title}</h1>
          <p className="m-0 text-[15px] text-ink2">
            {filtered.length} {t.c.items}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {canEdit && (
            <button type="button" onClick={() => setCatsOpen(true)} className={btn.outline}>
              <AIcon name="grid" />
              {t.prod.cats}
            </button>
          )}
          {canEdit && (
            <Link href="/admin/products/new" className={btn.primary}>
              <AIcon name="plus" />
              {t.prod.add}
            </Link>
          )}
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2.5 p-3">
        <label className="relative block flex-[1_1_240px]">
          <span className="sr-only">{t.prod.search}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 text-ink3">
            <AIcon name="search" />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t.prod.search}
            className="field min-h-11 pl-10"
          />
        </label>
        <select value={cat} onChange={(e) => (setCat(e.target.value), setPage(1))} aria-label={t.prod.colCat} className={`${selectCls} flex-[1_1_180px]`}>
          <option value="all">{t.prod.allCats}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} aria-label={t.prod.colStatus} className={`${selectCls} flex-[1_1_150px]`}>
          <option value="all">{t.prod.allStatus}</option>
          <option value="pub">{t.prod.pub}</option>
          <option value="draft">{t.prod.draft}</option>
        </select>
        <div className="hidden gap-0.5 rounded-lg border border-line p-[3px] md2:flex" role="group">
          {(["table", "cards"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-label={t.prod[v]}
              aria-pressed={view === v}
              title={t.prod[v]}
              className={`grid h-9 w-[38px] cursor-pointer place-items-center rounded-md border-0 transition-colors duration-[250ms] ${
                view === v ? "bg-blue-solid text-white" : "bg-transparent text-ink2"
              }`}
            >
              <AIcon name={v === "table" ? "list" : "grid"} />
            </button>
          ))}
        </div>
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-blue-solid bg-soft py-2.5 pl-4 pr-3 [animation:a-up_.3s_cubic-bezier(.2,.7,.2,1)_both]">
          <strong className="flex-1 text-[14.5px] text-blue">
            {t.c.selected} {sel.length} {t.c.items}
          </strong>
          <button type="button" onClick={() => setSel([])} className="min-h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3.5 text-[14.5px] text-ink hover:bg-surface">
            {t.c.clear}
          </button>
          <button type="button" onClick={() => setConfirm(sel)} className={`${btn.danger} min-h-10 px-3.5 text-[14.5px]`}>
            <AIcon name="trash" />
            {t.c.delSel}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3.5 px-6 py-16 text-center [animation:a-up_.5s_both]">
          <span className="grid size-[68px] place-items-center rounded-[18px] bg-soft text-blue">
            <AIcon name={isFiltered && products.length ? "search" : "box"} size={28} />
          </span>
          <strong className="text-[19px]">{isFiltered && products.length ? t.prod.emptyT : t.prod.noneT}</strong>
          <p className="m-0 max-w-[400px] text-[15px] leading-[1.6] text-ink2">{isFiltered && products.length ? t.prod.emptyD : t.prod.noneD}</p>
          {isFiltered && products.length ? (
            <button type="button" onClick={clearFilters} className={`${btn.primary} mt-1`}>
              {t.prod.clearF}
            </button>
          ) : (
            canEdit && (
              <Link href="/admin/products/new" className={`${btn.primary} mt-1`}>
                {t.prod.add}
              </Link>
            )
          )}
        </div>
      ) : (
        <>
          {/* แบบตาราง สำหรับแท็บเล็ตและคอมพิวเตอร์ */}
          <div className={`card overflow-auto ${view === "table" ? "hidden md2:block" : "hidden"}`}>
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="bg-surface2 text-left">
                  <th className="w-[52px] py-3 pl-[18px]">
                    {canDel && (
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => setSel((s) => (allChecked ? s.filter((x) => !items.some((p) => p.id === x)) : [...new Set([...s, ...items.map((p) => p.id)])]))}
                        aria-label={t.prod.selAll}
                        className="block size-[18px] cursor-pointer accent-[var(--blue-solid)]"
                      />
                    )}
                  </th>
                  {[t.prod.colName, t.prod.colCat, t.prod.colStatus, t.prod.colUpd].map((h) => (
                    <th key={h} className="px-4 py-3 text-[13px] font-semibold text-ink2">
                      {h}
                    </th>
                  ))}
                  <th className="px-[18px] py-3 text-right text-[13px] font-semibold text-ink2">{t.prod.colAct}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ animationDelay: `${i * 0.03}s` }}
                    className={`border-t border-line transition-colors [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both] hover:bg-surface2 ${sel.includes(p.id) ? "bg-soft" : ""}`}
                  >
                    <td className="py-3 pl-[18px]">{check(p)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <Thumb img={p.img} sku={p.sku} className="size-[52px] flex-none rounded-lg" />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Link href={editHref(p)} className="text-left text-[15px] font-semibold text-ink hover:text-blue">
                            {p.name[lang] || p.name[ol]}
                          </Link>
                          <span className="text-[13.5px] text-ink2">{p.name[ol]}</span>
                          <span className="font-mono text-xs font-medium text-ink3">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14.5px] text-ink2">{catName(p.category)}</td>
                    <td className="px-4 py-3">{st(p.status)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink2">
                      <span className="flex flex-col gap-0.5">
                        <span>{p.updatedAt ? fmtDate(p.updatedAt, lang, false) : "—"}</span>
                        <span className="text-[12.5px] text-ink3">{by(p.updatedBy)}</span>
                      </span>
                    </td>
                    <td className="px-[18px] py-3">
                      <div className="flex justify-end gap-1">{actions(p)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* แบบการ์ด สำหรับแท็บเล็ตและคอมพิวเตอร์ */}
          <div className={`grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-4 ${view === "cards" ? "hidden md2:grid" : "hidden"}`}>
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 0.04}s` }}
                className={`flex flex-col overflow-hidden rounded-xl border bg-surface transition-[transform,box-shadow] duration-300 [animation:a-up_.45s_cubic-bezier(.2,.7,.2,1)_both] hover:-translate-y-1 hover:shadow-lift ${
                  sel.includes(p.id) ? "border-blue-solid" : "border-line"
                }`}
              >
                <div className="relative">
                  <Thumb img={p.img} sku={p.sku} className="aspect-[4/3] w-full border-0" text="text-[13px]" />
                  {canDel && <label className="absolute left-1.5 top-1.5 grid size-10 cursor-pointer place-items-center">{check(p)}</label>}
                  <span className="absolute right-2.5 top-2.5">{st(p.status)}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1 px-4 py-3.5">
                  <strong className="text-[15px] leading-[1.4]">{p.name[lang] || p.name[ol]}</strong>
                  <span className="text-[13.5px] text-ink2">{p.name[ol]}</span>
                  <span className="mt-1 text-[13px] text-ink3">
                    {catName(p.category)} · {p.updatedAt ? relDate(p.updatedAt, lang) : "—"}
                  </span>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <Link href={editHref(p)} className={`${btn.outline} min-h-10 flex-1 text-[14.5px]`}>
                    <AIcon name="edit" />
                    {t.c.edit}
                  </Link>
                  {canDel && (
                    <button
                      type="button"
                      onClick={() => setConfirm([p.id])}
                      aria-label={t.c.del}
                      className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink2 hover:border-red hover:bg-red-soft hover:text-red"
                    >
                      <AIcon name="trash" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* แบบรายการ สำหรับมือถือ */}
          <div className="flex flex-col gap-2.5 md2:hidden">
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 0.03}s` }}
                className={`flex items-start gap-2 rounded-xl border bg-surface py-3 pl-1 pr-2 [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both] ${sel.includes(p.id) ? "border-blue-solid" : "border-line"}`}
              >
                <label className="grid h-14 w-11 flex-none cursor-pointer place-items-center">{check(p, "size-5")}</label>
                <Thumb img={p.img} sku={p.sku} className="size-14 flex-none rounded-lg" text="text-[9.5px]" />
                <Link href={editHref(p)} className="flex min-w-0 flex-1 flex-col gap-[3px] text-ink hover:text-ink">
                  <strong className="text-[15px] leading-[1.4]">{p.name[lang] || p.name[ol]}</strong>
                  <span className="text-[13px] text-ink2">{p.name[ol]}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    {st(p.status)}
                    <span className="text-[12.5px] text-ink3">{catName(p.category)}</span>
                  </span>
                </Link>
                <div className="flex flex-col">{actions(p)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-ink2">
            {lang === "th"
              ? `แสดง ${(cur - 1) * PER + 1}–${Math.min(cur * PER, filtered.length)} จาก ${filtered.length} รายการ`
              : `Showing ${(cur - 1) * PER + 1}–${Math.min(cur * PER, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setPage(cur - 1)} disabled={cur <= 1} aria-label="Previous" className={pagerBtn}>
              <AIcon name="chevL" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === cur ? "page" : undefined}
                className={`h-[42px] min-w-[42px] cursor-pointer rounded-lg border text-[14.5px] font-semibold transition-colors ${
                  n === cur ? "border-blue-solid bg-blue-solid text-white" : "border-line bg-surface text-ink"
                }`}
              >
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setPage(cur + 1)} disabled={cur >= pages} aria-label="Next" className={pagerBtn}>
              <AIcon name="chevR" />
            </button>
          </div>
        </div>
      )}

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onOk={() => confirm && !pending && doDelete(confirm)}
        title={confirm && confirm.length > 1 ? t.cf.delManyTitle : t.cf.delTitle}
        text={t.cf.delText}
        items={confirm?.map((id) => products.find((p) => p.id === id)?.name[lang] ?? id)}
        okLabel={t.cf.delOk}
      />
      {catsOpen && (
        <CategoriesModal
          categories={categories}
          counts={Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category === c.id).length]))}
          onClose={() => setCatsOpen(false)}
        />
      )}
    </div>
  );
}

const pagerBtn =
  "grid size-[42px] cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink disabled:cursor-not-allowed disabled:opacity-40";
