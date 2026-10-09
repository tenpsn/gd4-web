"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteActivity } from "@/app/admin/actions/activity";
import type { Activity, PublicUser } from "@/server/types";
import { AIcon } from "./AIcon";
import { avatarColor } from "./avatar";
import { useAdmin } from "./context";
import { fmtDate, relDate } from "./i18n";
import { btn, Confirm, PAGE_SIZE, Pager, useToast } from "./ui";

/**
 * รายการประวัติการใช้งาน แสดงหน้าละ 10 แถว ใช้ทั้งหน้าแดชบอร์ดและแท็บประวัติการแก้ไข
 * ถ้ามีสิทธิ์ลบ จะติ๊กเลือกได้ เลือกข้ามหน้าได้ และลบเฉพาะรายการที่เลือก
 */
export function ActivityList({ activity, users, empty, fullDate = false, rowClass = "px-5", canDel = false }: {
  activity: Activity[];
  users: Pick<PublicUser, "id" | "name" | "ini">[];
  empty: string;
  /** แสดงวันที่เต็มก่อนเวลาที่ผ่านมา */
  fullDate?: boolean;
  rowClass?: string;
  canDel?: boolean;
}) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<number[] | null>(null);
  const [pending, start] = useTransition();
  const pages = Math.max(1, Math.ceil(activity.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const rows = activity.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const userBy = (id: number) => users.find((u) => u.id === id);
  const allChecked = rows.length > 0 && rows.every((a) => sel.includes(a.id));
  const offPage = sel.filter((id) => !rows.some((a) => a.id === id)).length;
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const doDelete = (ids: number[]) =>
    start(async () => {
      const n = await deleteActivity(ids);
      setConfirm(null);
      setSel((s) => s.filter((x) => !ids.includes(x)));
      toast("ok", lang === "th" ? `ลบประวัติแล้ว ${n} รายการ` : `Deleted ${n} entries`);
      router.refresh();
    });

  if (!activity.length) return <div className={`border-t border-line py-10 text-center text-[15px] text-ink2 ${rowClass}`}>{empty}</div>;

  return (
    <>
      {canDel && (
        <div className={`flex flex-wrap items-center gap-2.5 border-t border-line py-2.5 ${rowClass} ${sel.length ? "bg-soft" : ""}`}>
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink2">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() => setSel((s) => (allChecked ? s.filter((x) => !rows.some((a) => a.id === x)) : [...new Set([...s, ...rows.map((a) => a.id)])]))}
              className="size-[18px] cursor-pointer accent-[var(--blue-solid)]"
            />
            {lang === "th" ? "เลือกทั้งหน้านี้" : "Select this page"}
          </label>
          {sel.length > 0 && (
            <>
              <span className="flex flex-1 flex-col gap-0.5">
                <strong className="text-[14.5px] text-blue">
                  {t.c.selected} {sel.length} {t.c.items}
                </strong>
                {offPage > 0 && (
                  <span className="text-[13px] text-ink2">{lang === "th" ? `ในนี้มี ${offPage} รายการที่เลือกไว้จากหน้าอื่น` : `${offPage} of them selected on other pages`}</span>
                )}
              </span>
              <button type="button" onClick={() => setSel([])} className="min-h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3.5 text-[14.5px] text-ink hover:bg-surface">
                {t.c.clear}
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirm(sel)} className={`${btn.danger} min-h-10 px-3.5 text-[14.5px]`}>
                <AIcon name="trash" />
                {t.c.delSel}
              </button>
            </>
          )}
        </div>
      )}
      <ol className="m-0 list-none p-0">
        {rows.map((a, i) => {
          const u = userBy(a.userId);
          const checked = sel.includes(a.id);
          return (
            <li
              key={a.id}
              style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
              className={`flex items-start gap-3.5 border-t border-line py-3.5 [animation:a-up_.35s_both] ${rowClass} ${checked ? "bg-soft" : ""}`}
            >
              {canDel && (
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(a.id)}
                  aria-label={`${u?.name[lang] ?? "—"} ${a.action[lang]} ${a.target[lang]}`}
                  className="mt-2.5 size-[18px] flex-none cursor-pointer accent-[var(--blue-solid)]"
                />
              )}
              <span className="grid size-9 flex-none place-items-center rounded-full text-[12.5px] font-bold text-white" style={{ background: u ? avatarColor(u.id) : "#6b778a" }}>
                {u?.ini[lang] ?? "?"}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[15px] leading-[1.55]">
                  <strong className="font-semibold">{u?.name[lang] ?? "—"}</strong> {a.action[lang]} <span className="font-medium text-blue">{a.target[lang]}</span>
                </span>
                <time className="text-[13px] text-ink3">{fullDate ? `${fmtDate(a.when, lang)} · ${relDate(a.when, lang)}` : relDate(a.when, lang)}</time>
              </span>
            </li>
          );
        })}
      </ol>
      {pages > 1 && (
        <div className={`border-t border-line py-3.5 ${rowClass}`}>
          <Pager page={cur} total={activity.length} onPage={setPage} />
        </div>
      )}
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onOk={() => confirm && doDelete(confirm)}
        title={lang === "th" ? "ลบประวัติ?" : "Delete entries?"}
        text={lang === "th" ? `จะลบประวัติ ${confirm?.length ?? 0} รายการ ประวัติที่ลบจะไม่สามารถกู้คืนได้` : `${confirm?.length ?? 0} entries will be deleted. This cannot be undone.`}
        okLabel={t.cf.delOk}
      />
    </>
  );
}
