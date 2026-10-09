"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ActivityList } from "@/admin/ActivityList";
import { AIcon, type AIconName } from "@/admin/AIcon";
import { avatarColor } from "@/admin/avatar";
import { useAdmin } from "@/admin/context";
import { relDate } from "@/admin/i18n";
import { btn, Confirm, FieldError, label, Modal, PAGE_SIZE, pageTitle, Pager, RadioCard, Req, useToast } from "@/admin/ui";
import { ACTIONS, allowed, AREAS, ROLES, superOnly, type Activity, type Perms, type PublicUser, type Role } from "@/server/types";
import { deleteUser, resendInvite, savePerms, saveUser, setUserStatus, type UserErrors, type UserResult } from "../../actions/users";

const ROLE_TONE: Record<Role, string> = {
  super: "bg-red-soft text-red",
  editor: "bg-soft text-blue",
  products: "bg-green-soft text-green",
  viewer: "bg-surface2 text-ink2",
};
const ROLE_DOT: Record<Role, string> = { super: "bg-red", editor: "bg-blue", products: "bg-green", viewer: "bg-ink2" };
const ST_TONE = { active: "bg-green-soft text-green", suspended: "bg-amber-soft text-amber", invited: "bg-soft text-blue" };

type Tab = "list" | "roles" | "log";

export function Users({ me, users, perms, activity, canEdit, canDel, canViewLog, canDelLog }: {
  me: number;
  users: PublicUser[];
  perms: Perms;
  activity: Activity[];
  canEdit: boolean;
  canDel: boolean;
  canViewLog: boolean;
  canDelLog: boolean;
}) {
  const { lang, t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("list");
  const [form, setForm] = useState<{ id: number | null; name: string; email: string; role: Role } | null>(null);
  const [errors, setErrors] = useState<UserErrors>({});
  const [del, setDel] = useState<PublicUser | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const fail = (r: UserResult) => {
    if (r.ok) return false;
    if (r.errors) setErrors(r.errors);
    toast("err", r.error === "noSelf" ? t.toast.noSelf : r.error === "lastSuper" ? (lang === "th" ? "ต้องมีผู้ดูแลสูงสุดที่ใช้งานอยู่อย่างน้อย 1 คน" : "At least one active super admin is required") : t.toast.fix);
    return true;
  };
  const run = (fn: () => Promise<UserResult>, okMsg: string | ((r: UserResult) => string), after?: (r: UserResult) => void) =>
    start(async () => {
      const r = await fn();
      if (fail(r)) return;
      toast("ok", typeof okMsg === "string" ? okMsg : okMsg(r));
      after?.(r);
      router.refresh();
    });

  const submitUser = () => {
    if (!form) return;
    run(() => saveUser(form), () => (form.id ? t.toast.userSaved : t.users.added), (r) => {
      setForm(null);
      setErrors({});
      if (r.ok && r.inviteLink) setInvite(r.inviteLink);
    });
  };

  const tabs: [Tab, string, AIconName][] = [
    ["list", t.users.tList, "users"],
    ["roles", t.users.tRoles, "shield"],
    ...(canViewLog ? ([["log", t.users.tLog, "history"]] as [Tab, string, AIconName][]) : []),
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="anim-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className={pageTitle}>{t.users.title}</h1>
          <p className="m-0 text-[15px] text-ink2">{t.users.sub}</p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => (setErrors({}), setForm({ id: null, name: "", email: "", role: "editor" }))} className={btn.primary}>
            <AIcon name="plus" />
            {t.users.add}
          </button>
        )}
      </div>

      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-surface p-1" role="tablist">
        {tabs.map(([k, lbl, icon]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`inline-flex min-h-[42px] flex-none cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] border-0 px-3.5 text-[14.5px] font-semibold transition-colors ${
              tab === k ? "bg-blue-solid text-white" : "bg-transparent text-ink2"
            }`}
          >
            <AIcon name={icon} />
            {lbl}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <UserList
          users={users}
          me={me}
          canEdit={canEdit}
          canDel={canDel}
          onEdit={(u) => (setErrors({}), setForm({ id: u.id, name: u.name[lang], email: u.email, role: u.role }))}
          onSuspend={(u) => run(() => setUserStatus(u.id, u.status === "suspended" ? "active" : "suspended"), u.status === "suspended" ? t.toast.unsuspended : t.toast.suspended)}
          onResend={(u) => run(() => resendInvite(u.id), () => t.users.linkReady, (r) => r.ok && r.inviteLink && setInvite(r.inviteLink))}
          onDelete={setDel}
        />
      )}
      {tab === "roles" && <RolesTab perms={perms} users={users} canEdit={canEdit} />}
      {tab === "log" && canViewLog && <LogTab activity={activity} users={users} canDel={canDelLog} />}

      {/* เพิ่มหรือแก้ไขผู้ดูแล */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        width={520}
        title={form?.id ? t.users.editTitle : t.users.addTitle}
        footer={
          <>
            <button type="button" onClick={() => setForm(null)} className={btn.outline}>
              {t.c.cancel}
            </button>
            <button type="button" onClick={submitUser} disabled={pending} className={btn.primary}>
              {t.c.save}
            </button>
          </>
        }
      >
        {form && (
          <form
            onSubmit={(e) => (e.preventDefault(), submitUser())}
            className="flex flex-col gap-4 px-6 py-5"
          >
            <label className="flex flex-col gap-1.5">
              <span className={label}>
                {t.users.name}
                <Req />
              </span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} className="field min-h-11" autoComplete="off" />
              <FieldError text={errors.name && t.users[errors.name as "errName"]} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>
                {t.users.email}
                <Req />
              </span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} className="field min-h-11" autoComplete="off" />
              <FieldError text={errors.email && t.users[errors.email as "errEmail" | "errDup"]} />
            </label>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={t.users.role}>
              <span className={label}>{t.users.role}</span>
              {ROLES.map((r) => (
                <RadioCard key={r} on={form.role === r} onPick={() => setForm({ ...form, role: r })} title={t.users[r]} desc={t.users[`${r}D` as "superD"]} disabled={form.id === me && r !== "super" && form.role === "super"} />
              ))}
            </div>
            {!form.id && (
              <span className="flex items-center gap-2 text-[13.5px] text-ink2">
                <AIcon name="mail" />
                {t.users.invite}
              </span>
            )}
            <button type="submit" hidden />
          </form>
        )}
      </Modal>

      {/* ถ้าส่งอีเมลเชิญไม่ได้ จะแสดงลิงก์ให้คัดลอกไปส่งเอง */}
      <Modal open={!!invite} onClose={() => setInvite(null)} width={520} title={t.users.linkTitle} footer={<button type="button" onClick={() => setInvite(null)} className={btn.primary}>{t.c.done}</button>}>
        <div className="flex flex-col gap-3 px-6 py-5">
          <p className="m-0 text-sm leading-[1.6] text-ink2">
            {t.users.linkText}
          </p>
          <input readOnly value={invite ?? ""} onFocus={(e) => e.target.select()} className="field font-mono text-[13px]" />
        </div>
      </Modal>

      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        onOk={() => del && run(() => deleteUser(del.id), t.toast.deleted, () => setDel(null))}
        title={t.cf.delUserTitle}
        text={t.cf.delUserText}
        items={del ? [`${del.name[lang]} · ${del.email}`] : []}
        okLabel={t.c.del}
      />
    </div>
  );
}

function UserList({ users, me, canEdit, canDel, onEdit, onSuspend, onResend, onDelete }: {
  users: PublicUser[];
  me: number;
  canEdit: boolean;
  canDel: boolean;
  onEdit: (u: PublicUser) => void;
  onSuspend: (u: PublicUser) => void;
  onResend: (u: PublicUser) => void;
  onDelete: (u: PublicUser) => void;
}) {
  const { lang, t } = useAdmin();
  const stLabel = { active: t.users.sActive, suspended: t.users.sSuspended, invited: t.users.sInvited };
  // แสดงหน้าละ 10 คน
  const [page, setPage] = useState(1);
  const pg = Math.min(page, Math.max(1, Math.ceil(users.length / PAGE_SIZE)));
  const shown = users.slice((pg - 1) * PAGE_SIZE, pg * PAGE_SIZE);
  const last = (u: PublicUser) => (u.lastActive ? relDate(u.lastActive, lang) : t.users.sInvited);
  const actions = (u: PublicUser, size: string) => (
    <>
      {canEdit && u.status === "invited" && (
        <button type="button" onClick={() => onResend(u)} aria-label={t.users.resend} title={t.users.resend} className={`${btn.icon} ${size}`}>
          <AIcon name="mail" />
        </button>
      )}
      {canEdit && (
        <button type="button" onClick={() => onEdit(u)} aria-label={t.c.edit} title={t.c.edit} className={`${btn.icon} ${size}`}>
          <AIcon name="edit" />
        </button>
      )}
      {canEdit && u.id !== me && u.status !== "invited" && (
        <button
          type="button"
          onClick={() => onSuspend(u)}
          aria-label={u.status === "suspended" ? t.users.unsuspend : t.users.suspend}
          title={u.status === "suspended" ? t.users.unsuspend : t.users.suspend}
          className={`grid cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 hover:bg-amber-soft hover:text-amber ${size}`}
        >
          <AIcon name={u.status === "suspended" ? "undo" : "lock"} />
        </button>
      )}
      {canDel && u.id !== me && (
        <button type="button" onClick={() => onDelete(u)} aria-label={t.c.del} title={t.c.del} className={`${btn.iconDanger} ${size}`}>
          <AIcon name="trash" />
        </button>
      )}
    </>
  );
  const avatar = (u: PublicUser, s: string) => (
    <span className={`grid flex-none place-items-center rounded-full text-[13px] font-bold text-white ${s}`} style={{ background: avatarColor(u.id) }}>
      {u.ini[lang]}
    </span>
  );

  return (
    <>
      <div className="card hidden overflow-auto [animation:a-up_.4s_both] md2:block">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="bg-surface2 text-left">
              {[t.users.name, t.users.role, t.users.status, t.users.last].map((h, i) => (
                <th key={h} className={`py-3 text-[13px] font-semibold text-ink2 ${i ? "px-3.5" : "px-[18px]"}`}>
                  {h}
                </th>
              ))}
              <th className="px-[18px] py-3 text-right text-[13px] font-semibold text-ink2">{t.prod.colAct}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((u, i) => (
              <tr key={u.id} style={{ animationDelay: `${i * 0.05}s` }} className="border-t border-line [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both] hover:bg-surface2">
                <td className={`px-[18px] py-3 ${u.status === "suspended" ? "opacity-55" : ""}`}>
                  <div className="flex items-center gap-3">
                    {avatar(u, "size-[42px]")}
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <strong className="text-[15px] font-semibold">{u.name[lang]}</strong>
                        {u.id === me && <span className="rounded-full bg-soft px-[7px] py-px text-[11.5px] font-semibold text-blue">{t.users.you}</span>}
                      </span>
                      <span className="text-[13.5px] text-ink2">{u.email}</span>
                    </span>
                  </div>
                </td>
                <td className="px-3.5 py-3">
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold ${ROLE_TONE[u.role]}`}>{t.users[u.role]}</span>
                </td>
                <td className="px-3.5 py-3">
                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold ${ST_TONE[u.status]}`}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {stLabel[u.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3.5 py-3 text-sm text-ink2">{last(u)}</td>
                <td className="px-[18px] py-3">
                  <div className="flex justify-end gap-0.5">{actions(u, "size-[38px]")}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2.5 md2:hidden">
        {shown.map((u, i) => (
          <div key={u.id} style={{ animationDelay: `${i * 0.05}s` }} className="card flex flex-col gap-2.5 p-3.5 [animation:a-up_.4s_both]">
            <div className={`flex items-center gap-3 ${u.status === "suspended" ? "opacity-55" : ""}`}>
              {avatar(u, "size-11 text-sm")}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="text-[15px]">{u.name[lang]}</strong>
                <span className="overflow-hidden text-ellipsis text-[13px] text-ink2">{u.email}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_TONE[u.role]}`}>{t.users[u.role]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ST_TONE[u.status]}`}>{stLabel[u.status]}</span>
              <span className="text-[12.5px] text-ink3">{last(u)}</span>
              <span className="flex-1" />
              {actions(u, "size-11")}
            </div>
          </div>
        ))}
      </div>
      <Pager page={pg} total={users.length} onPage={setPage} />
    </>
  );
}

function RolesTab({ perms, users, canEdit }: { perms: Perms; users: PublicUser[]; canEdit: boolean }) {
  const { t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState<Role>("editor");
  const [draft, setDraft] = useState<Perms>(() => structuredClone(perms));
  const [pending, start] = useTransition();
  const locked = role === "super" || !canEdit;
  const areaLabel = (a: (typeof AREAS)[number]) => t.nav[a];

  const toggle = (a: (typeof AREAS)[number], x: (typeof ACTIONS)[number]) =>
    setDraft((d) => {
      const n = structuredClone(d);
      const on = !n[role][a][x];
      n[role][a][x] = on;
      // ปิดสิทธิ์ดูแล้วสิทธิ์อื่นในส่วนนั้นจะปิดตามหมด และเปิดสิทธิ์ใดก็ต้องเปิดสิทธิ์ดูด้วย
      if (x === "view" && !on) ACTIONS.forEach((y) => (n[role][a][y] = false));
      if (x !== "view" && on) n[role][a].view = true;
      return n;
    });

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2.5 [animation:a-up_.4s_both]" role="radiogroup">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={`flex cursor-pointer flex-col gap-1 rounded-xl border-[1.5px] px-4 py-3.5 text-left text-ink transition-colors ${role === r ? "border-blue-solid bg-soft" : "border-line bg-surface"}`}
          >
            <span className="flex items-center gap-2">
              <span className={`size-[9px] rounded-full ${ROLE_DOT[r]}`} />
              <strong className={`text-[15px] ${role === r ? "text-blue" : "text-ink"}`}>{t.users[r]}</strong>
            </span>
            <span className="text-[13px] text-ink2">
              {users.filter((u) => u.role === r).length} {t.users.people}
            </span>
          </button>
        ))}
      </div>
      <section className="card overflow-hidden [animation:a-up_.45s_.05s_both]">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex flex-[1_1_260px] flex-col gap-[3px]">
            <strong className="text-[15.5px]">{t.users.rolesSub}</strong>
            <span className="text-[13.5px] text-ink2">{t.users[`${role}D` as "superD"]}</span>
          </span>
          {role === "super" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-soft px-2.5 py-1.5 text-[13px] text-amber">
              <AIcon name="lock" />
              {t.users.superLocked}
            </span>
          )}
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="bg-surface2">
                <th className="px-5 py-3 text-left text-[13px] font-semibold text-ink2">{t.users.area}</th>
                {ACTIONS.map((x) => (
                  <th key={x} className="w-[90px] px-2 py-3 text-center text-[13px] font-semibold text-ink2">
                    {t.users[`a_${x}`]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AREAS.map((a, i) => (
                <tr key={a} style={{ animationDelay: `${i * 0.03}s` }} className="border-t border-line [animation:a-up_.35s_both]">
                  <td className="px-5 py-2.5 text-[14.5px] font-medium">{areaLabel(a)}</td>
                  {ACTIONS.map((x) => (
                    <td key={x} className="px-2 py-1.5 text-center">
                      {!allowed(a, x) ? (
                        <span className="text-ink3" aria-hidden="true">
                          —
                        </span>
                      ) : (
                      <label className="inline-grid size-11 cursor-pointer place-items-center" title={superOnly(a, x) ? t.users.superOnly : undefined}>
                        <input
                          type="checkbox"
                          checked={role === "super" || (!superOnly(a, x) && draft[role][a][x])}
                          disabled={locked || superOnly(a, x)}
                          onChange={() => toggle(a, x)}
                          aria-label={`${areaLabel(a)} · ${t.users[`a_${x}`]}`}
                          className="size-5 cursor-pointer accent-[var(--blue-solid)] disabled:cursor-not-allowed"
                        />
                      </label>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canEdit && (
          <div className="flex justify-end gap-2.5 border-t border-line px-5 py-3.5">
            <button type="button" onClick={() => setDraft(structuredClone(perms))} className={`${btn.outline} min-h-[42px] px-3.5 text-[14.5px]`}>
              <AIcon name="undo" />
              {t.dz.reset}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await savePerms(draft);
                  toast("ok", t.toast.permSaved);
                  router.refresh();
                })
              }
              className={`${btn.primary} min-h-[42px] text-[14.5px]`}
            >
              {t.users.savePerms}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

/** ประวัติการแก้ไขทั้งหมด แสดงหน้าละ 10 แถว */
function LogTab({ activity, users, canDel }: { activity: Activity[]; users: PublicUser[]; canDel: boolean }) {
  const { t } = useAdmin();
  return (
    <section className="card overflow-hidden [&>ol>li:first-child]:border-t-0">
      <ActivityList activity={activity} users={users} empty={t.users.logEmpty} fullDate canDel={canDel} />
    </section>
  );
}
