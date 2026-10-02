"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AIcon } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { downloadCsv } from "@/admin/csv";
import { fmtDate, relDate } from "@/admin/i18n";
import { btn, Confirm, pageTitle, useToast } from "@/admin/ui";
import type { Message, MessageStatus } from "@/server/types";
import { deleteMessages, setMessageStatus } from "../../actions/inbox";

type Filter = "all" | MessageStatus;

const ST: Record<MessageStatus, string> = {
  new: "bg-red-soft text-red",
  read: "bg-surface2 text-ink2 border border-line",
  replied: "bg-green-soft text-green",
};

export function Inbox({ messages, initialFilter, canEdit, canDel }: { messages: Message[]; initialFilter: Filter; canEdit: boolean; canDel: boolean }) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number[] | null>(null);
  const [, start] = useTransition();
  // เปลี่ยนสถานะในรายการทันทีโดยไม่ต้องรอเซิร์ฟเวอร์ตอบกลับ
  const [local, setLocal] = useState<Record<number, MessageStatus>>({});

  const list = messages.map((m) => (local[m.id] ? { ...m, status: local[m.id] } : m));
  const counts = { all: list.length, new: 0, read: 0, replied: 0 } as Record<Filter, number>;
  list.forEach((m) => counts[m.status]++);
  const term = q.trim().toLowerCase();
  const rows = list.filter(
    (m) => (filter === "all" || m.status === filter) && (!term || [m.name, m.company, m.msg, m.subject, m.email, m.phone].some((x) => x.toLowerCase().includes(term))),
  );
  const cur = list.find((m) => m.id === openId) ?? null;
  const allChecked = rows.length > 0 && rows.every((m) => sel.includes(m.id));

  const setStatus = (ids: number[], status: MessageStatus, quiet = false) => {
    if (!canEdit) return;
    setLocal((l) => ({ ...l, ...Object.fromEntries(ids.map((id) => [id, status])) }));
    start(async () => {
      try {
        await setMessageStatus(ids, status);
        if (!quiet) toast("ok", status === "replied" ? t.toast.replied : t.inbox.statusSet);
        router.refresh();
      } catch {
        toast("err", t.toast.fix);
      }
    });
  };
  const open = (m: Message) => {
    setOpenId(m.id);
    if (m.status === "new") setStatus([m.id], "read", true);
  };
  const doDelete = (ids: number[]) =>
    start(async () => {
      const n = await deleteMessages(ids);
      setConfirm(null);
      setSel((s) => s.filter((x) => !ids.includes(x)));
      if (openId && ids.includes(openId)) setOpenId(null);
      toast("ok", `${t.toast.deleted} (${n})`);
      router.refresh();
    });

  const exportCsv = () => {
    const header = [t.inbox.date, t.inbox.colName, t.inbox.company, t.inbox.phone, t.inbox.email, t.inbox.subject, t.form.detail, t.inbox.status];
    downloadCsv(`gd4-messages-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows.map((m) => [m.date, m.name, m.company, m.phone, m.email, m.subject, m.msg, t.inbox[m.status]])]);
    toast("ok", t.toast.exported);
  };

  const stLabel = (m: Message) => <span className={`whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12.5px] font-semibold ${ST[m.status]}`}>{t.inbox[m.status]}</span>;
  const tabs: Filter[] = ["all", "new", "read", "replied"];
  const newText = lang === "th" ? `ข้อความใหม่ ${counts.new} รายการ จากทั้งหมด ${counts.all}` : `${counts.new} new of ${counts.all} messages`;

  return (
    <div className="flex flex-col gap-4">
      <div className="anim-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className={pageTitle}>{t.inbox.title}</h1>
          <p className="m-0 text-[15px] text-ink2">{newText}</p>
        </div>
        <button type="button" onClick={exportCsv} disabled={!rows.length} className={`${btn.outline} hover:border-green-solid hover:text-green`}>
          <AIcon name="download" />
          {t.inbox.export}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-surface p-1" role="tablist">
          {tabs.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={filter === k}
              onClick={() => (setFilter(k), setSel([]))}
              className={`inline-flex min-h-10 flex-none cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] border-0 px-3 text-[14.5px] font-semibold transition-colors ${
                filter === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"
              }`}
            >
              {t.inbox[k]}
              <span className={`min-w-[22px] rounded-full px-1.5 py-px text-xs ${filter === k ? "bg-white/20" : "bg-surface2"}`}>{counts[k]}</span>
            </button>
          ))}
        </div>
        <label className="relative block flex-[1_1_240px]">
          <span className="sr-only">{t.inbox.search}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 text-ink3">
            <AIcon name="search" />
          </span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.inbox.search} className="field rounded-[10px] pl-10" />
        </label>
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-blue-solid bg-soft py-2.5 pl-4 pr-3 [animation:a-up_.3s_both]">
          <strong className="flex-1 text-[14.5px] text-blue">
            {t.c.selected} {sel.length} {t.c.items}
          </strong>
          {canEdit && (
            <button type="button" onClick={() => (setStatus(sel, "read"), setSel([]))} className="min-h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3.5 text-[14.5px] text-ink hover:bg-surface">
              {t.inbox.read}
            </button>
          )}
          <button type="button" onClick={() => setSel([])} className="min-h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3.5 text-[14.5px] text-ink hover:bg-surface">
            {t.c.clear}
          </button>
          {canDel && (
            <button type="button" onClick={() => setConfirm(sel)} className={`${btn.danger} min-h-10 px-3.5 text-[14.5px]`}>
              <AIcon name="trash" />
              {t.c.delSel}
            </button>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center [animation:a-up_.4s_both]">
          <span className="grid size-[68px] place-items-center rounded-[18px] bg-soft text-blue">
            <AIcon name={term ? "search" : "inbox"} size={28} />
          </span>
          <strong className="text-lg">{term ? t.inbox.noMatch : t.inbox.emptyT}</strong>
          {!term && <span className="max-w-[360px] text-[15px] leading-[1.6] text-ink2">{t.inbox.emptyD}</span>}
        </div>
      ) : (
        <>
          <div className="card hidden overflow-auto md2:block">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-surface2 text-left">
                  <th className="w-[52px] py-3 pl-[18px]">
                    {canDel && (
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => setSel(allChecked ? [] : rows.map((m) => m.id))}
                        aria-label={t.inbox.selAll}
                        className="block size-[18px] cursor-pointer accent-[var(--blue-solid)]"
                      />
                    )}
                  </th>
                  {[t.inbox.colName, t.inbox.company, t.inbox.phone, t.inbox.subject, t.inbox.date, t.inbox.status].map((h) => (
                    <th key={h} className="px-3.5 py-3 text-[13px] font-semibold text-ink2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => {
                  const unread = m.status === "new";
                  return (
                    <tr
                      key={m.id}
                      onClick={() => open(m)}
                      style={{ animationDelay: `${i * 0.03}s` }}
                      className={`cursor-pointer border-t border-line transition-colors [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both] hover:bg-surface2 ${sel.includes(m.id) ? "bg-soft" : ""}`}
                    >
                      <td className="py-3 pl-[18px]" onClick={(e) => e.stopPropagation()}>
                        {canDel && (
                          <input
                            type="checkbox"
                            checked={sel.includes(m.id)}
                            onChange={() => setSel((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
                            aria-label={m.name}
                            className="block size-[18px] cursor-pointer accent-[var(--blue-solid)]"
                          />
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <button type="button" className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left text-ink" onClick={(e) => (e.stopPropagation(), open(m))}>
                          {unread && <span className="size-2 flex-none rounded-full bg-red-solid" aria-label={t.inbox.unread} />}
                          <span className={`whitespace-nowrap text-[14.5px] ${unread ? "font-bold" : "font-medium"}`}>{m.name}</span>
                        </button>
                      </td>
                      <td className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap px-3.5 py-3 text-sm text-ink2">{m.company}</td>
                      <td className="whitespace-nowrap px-3.5 py-3 font-mono text-[13.5px] font-medium text-ink2">{m.phone}</td>
                      <td className="max-w-[300px] px-3.5 py-3">
                        <span className={`block overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] ${unread ? "font-bold" : "font-medium"}`}>{m.subject}</span>
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink3">{m.msg}</span>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 text-[13.5px] text-ink2">
                        <span className="flex flex-col gap-0.5">
                          <span>{fmtDate(m.date, lang, false)}</span>
                          <span className="text-[12.5px] text-ink3">{relDate(m.date, lang)}</span>
                        </span>
                      </td>
                      <td className="py-3 pl-3.5 pr-[18px]">{stLabel(m)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2.5 md2:hidden">
            {rows.map((m, i) => {
              const unread = m.status === "new";
              return (
                <div key={m.id} style={{ animationDelay: `${i * 0.03}s` }} className="relative flex overflow-hidden rounded-xl border border-line bg-surface [animation:a-up_.4s_both]">
                  {unread && <span className="absolute inset-y-0 left-0 w-[3px] bg-red-solid" />}
                  <label className="grid w-12 flex-none cursor-pointer place-items-center">
                    {canDel && (
                      <input
                        type="checkbox"
                        checked={sel.includes(m.id)}
                        onChange={() => setSel((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
                        aria-label={m.name}
                        className="size-5 accent-[var(--blue-solid)]"
                      />
                    )}
                  </label>
                  <button type="button" onClick={() => open(m)} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 border-0 bg-transparent py-3.5 pr-3.5 text-left text-ink">
                    <span className="flex justify-between gap-2.5">
                      <span className={`overflow-hidden text-ellipsis whitespace-nowrap text-[15px] ${unread ? "font-bold" : "font-medium"}`}>{m.name}</span>
                      <span className="flex-none text-[12.5px] text-ink3">{relDate(m.date, lang)}</span>
                    </span>
                    <span className={`overflow-hidden text-ellipsis whitespace-nowrap text-sm ${unread ? "font-bold" : "font-medium"}`}>{m.subject}</span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink2">
                      {m.company} · {m.phone}
                    </span>
                    <span className="mt-0.5 w-fit">{stLabel(m)}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {cur && (
        <MessagePanel
          m={cur}
          canEdit={canEdit}
          canDel={canDel}
          onClose={() => setOpenId(null)}
          onStatus={(s) => setStatus([cur.id], s)}
          onDelete={() => setConfirm([cur.id])}
        />
      )}

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onOk={() => confirm && doDelete(confirm)}
        title={t.cf.delMsgTitle}
        text={t.cf.delMsgText}
        items={confirm?.map((id) => list.find((m) => m.id === id)?.name ?? String(id))}
        okLabel={t.cf.delOk}
      />
    </div>
  );
}

function MessagePanel({ m, canEdit, canDel, onClose, onStatus, onDelete }: {
  m: Message;
  canEdit: boolean;
  canDel: boolean;
  onClose: () => void;
  onStatus: (s: MessageStatus) => void;
  onDelete: () => void;
}) {
  const { lang, t } = useAdmin();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const ini = m.name.replace(/^(พญ\.|นพ\.|ดร\.|Dr\.?)\s*/, "").slice(0, 1).toUpperCase();
  const mailto = `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`;
  const card = "flex flex-col gap-[3px] rounded-[10px] border border-line p-3 text-ink";

  return createPortal(
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-[var(--overlay)] [animation:a-fade_.25s_both]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={m.name}
        className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-full flex-col bg-surface text-ink shadow-[-20px_0_60px_-20px_rgba(0,0,0,.4)] [animation:a-slide_.4s_cubic-bezier(.2,.7,.2,1)_both] md2:w-[460px]"
      >
        <div className="flex min-h-16 items-center gap-2.5 border-b border-line py-3 pl-5 pr-3.5">
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold">{m.subject || t.inbox.pick}</span>
          <button type="button" onClick={onClose} aria-label={t.c.close} autoFocus className="grid size-11 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 hover:bg-surface2">
            <AIcon name="x" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-[18px] overflow-auto p-5">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 flex-none place-items-center rounded-full bg-blue-solid text-[17px] font-bold text-white">{ini}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <strong className="text-[17px]">{m.name}</strong>
              <span className="text-sm text-ink2">{m.company}</span>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-2.5">
            <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className={`${card} hover:text-ink hover:border-blue-solid`}>
              <span className="text-[12.5px] text-ink3">{t.inbox.phone}</span>
              <span className="text-[14.5px] font-medium">{m.phone}</span>
            </a>
            <a href={`mailto:${m.email}`} className={`${card} min-w-0 hover:text-ink hover:border-blue-solid`}>
              <span className="text-[12.5px] text-ink3">{t.inbox.email}</span>
              <span className="overflow-hidden text-ellipsis text-[14.5px] font-medium">{m.email}</span>
            </a>
            <span className={`${card} col-span-full`}>
              <span className="text-[12.5px] text-ink3">{t.inbox.date}</span>
              <span className="text-[14.5px] font-medium">{fmtDate(m.date, lang)}</span>
            </span>
          </div>
          <p className="m-0 whitespace-pre-wrap rounded-[10px] bg-surface2 p-[18px] text-[15.5px] leading-[1.8]">{m.msg}</p>
          {canEdit && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-ink2">{t.inbox.setStatus}</span>
              <div className="grid grid-cols-3 gap-1.5" role="radiogroup">
                {(["new", "read", "replied"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={m.status === s}
                    onClick={() => onStatus(s)}
                    className={`min-h-[42px] cursor-pointer rounded-lg border-[1.5px] text-sm font-semibold transition-colors ${
                      m.status === s ? "border-blue-solid bg-blue-solid text-white" : "border-line bg-surface text-ink2"
                    }`}
                  >
                    {t.inbox[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2.5 border-t border-line px-5 py-3.5">
          <a
            href={mailto}
            onClick={() => canEdit && m.status !== "replied" && onStatus("replied")}
            className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-blue-solid text-[15px] font-semibold text-white hover:bg-blue-h hover:text-white"
          >
            <AIcon name="reply" />
            {t.inbox.reply}
          </a>
          {canDel && (
            <button type="button" onClick={onDelete} aria-label={t.c.del} title={t.c.del} className="grid size-[46px] flex-none cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink2 hover:border-red hover:bg-red-soft hover:text-red">
              <AIcon name="trash" />
            </button>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
