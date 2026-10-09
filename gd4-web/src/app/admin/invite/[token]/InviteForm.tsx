"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { Spinner } from "@/admin/controls";
import { btn, FieldError, label } from "@/admin/ui";
import { acceptInvite } from "../../actions/users";

/** ฟอร์มตั้งรหัสผ่านจากลิงก์เชิญ */
export function InviteForm({ token }: { token: string }) {
  const { lang, t } = useAdmin();
  const [pw, setPw] = useState("");
  const [conf, setConf] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const title = lang === "th" ? "ตั้งรหัสผ่านเพื่อเริ่มใช้งาน" : "Set a password to get started";
  const expired = lang === "th" ? "ลิงก์เชิญหมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่จากผู้ดูแล" : "This invite link has expired or was already used. Ask an admin for a new one.";

  if (done) {
    return (
      <>
        <span className="grid size-16 place-items-center rounded-full bg-green-soft text-green [animation:a-pop_.5s_cubic-bezier(.34,1.56,.64,1)_both]">
          <AIcon name="check" />
        </span>
        <h1 className="m-0 text-[28px] font-bold">{t.toast.pwSaved}</h1>
        <Link href="/admin/login" className={`${btn.primary} min-h-[50px]`}>
          {t.login.submit}
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[28px] font-bold leading-[1.3]">{title}</h1>
        <p className="m-0 text-[15.5px] leading-[1.6] text-ink2">{t.set.rule}</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw)) return setErr(t.set.errNw);
          if (pw !== conf) return setErr(t.set.errConf);
          start(async () => {
            const r = await acceptInvite(token, pw);
            if (r.ok) setDone(true);
            else setErr(r.error === "errNw" ? t.set.errNw : expired);
          });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className={label}>{t.set.nw}</span>
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className={label}>{t.set.conf}</span>
          <input type="password" autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} className="field" />
        </label>
        <FieldError text={err} />
        <button type="submit" disabled={pending} className={`${btn.primary} min-h-[50px] text-base`}>
          {pending && <Spinner />}
          {t.c.save}
        </button>
      </form>
    </>
  );
}
