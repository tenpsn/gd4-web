"use client";

import { useActionState, useState, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { Spinner } from "@/admin/controls";
import { login, requestReset, type LoginState } from "../actions/auth";

type Mode = "login" | "forgot" | "sent";

const label = "text-sm font-semibold";
const primaryBtn =
  "flex min-h-[50px] cursor-pointer items-center justify-center gap-2.5 rounded-lg border-0 bg-blue-solid text-base font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-blue-h active:scale-[.98] disabled:cursor-wait";

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <span id={id} className="flex items-center gap-1.5 text-[13px] text-red [animation:a-up_.25s_ease-out_both]">
      <AIcon name="alert" />
      {text}
    </span>
  );
}

export function LoginForm() {
  const { t } = useAdmin();
  const [mode, setMode] = useState<Mode>("login");
  const [state, action, busy] = useActionState<LoginState, FormData>(login, undefined);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  // จำรหัสผ่านไว้ไม่ให้ช่องว่างเมื่อล็อกอินไม่ผ่าน
  const [pw, setPw] = useState("");
  const [resetErr, setResetErr] = useState(false);
  const [resetBusy, startReset] = useTransition();

  const err = state?.errors;
  const emailErr = err?.email ? t.login[err.email] : undefined;
  const pwErr = err?.pw ? t.login[err.pw] : undefined;

  if (mode === "sent") {
    return (
      <>
        <span className="grid size-16 place-items-center rounded-full bg-green-soft text-green [animation:a-pop_.5s_cubic-bezier(.34,1.56,.64,1)_both]">
          <AIcon name="mail" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold">{t.login.sentTitle}</h1>
          <p className="m-0 text-[15.5px] leading-[1.6] text-ink2">
            {t.login.sentText} <strong className="text-ink">{email}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode("login")}
          className="min-h-12 cursor-pointer rounded-lg border border-line bg-surface text-[15px] font-semibold text-ink hover:border-blue-solid hover:text-blue"
        >
          {t.login.back}
        </button>
      </>
    );
  }

  if (mode === "forgot") {
    return (
      <>
        <button
          type="button"
          onClick={() => setMode("login")}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[14.5px] font-medium text-blue hover:text-red"
        >
          <AIcon name="arrowL" />
          {t.login.back}
        </button>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold">{t.login.fTitle}</h1>
          <p className="m-0 text-[15.5px] leading-[1.6] text-ink2">{t.login.fSub}</p>
        </div>
        <form
          noValidate
          className="flex flex-col gap-[18px]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startReset(async () => {
              const res = await requestReset(fd);
              setResetErr(!res.ok);
              if (res.ok) {
                setEmail(res.email);
                setMode("sent");
              }
            });
          }}
        >
          <label className="flex flex-col gap-2">
            <span className={label}>{t.login.email}</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={email}
              aria-invalid={resetErr}
              aria-describedby={resetErr ? "rs-email-err" : undefined}
              className="field"
            />
            <FieldError id="rs-email-err" text={resetErr ? t.login.errEmail : undefined} />
          </label>
          <button type="submit" disabled={resetBusy} className={primaryBtn}>
            {resetBusy && <Spinner />}
            {t.login.fSend}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[28px] font-bold leading-[1.3]">{t.login.title}</h1>
        <p className="m-0 text-[15.5px] leading-[1.6] text-ink2">{t.login.sub}</p>
      </div>
      <form action={action} noValidate className="flex flex-col gap-[18px]">
        <label className="flex flex-col gap-2">
          <span className={label}>{t.login.email}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state?.email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!emailErr}
            aria-describedby={emailErr ? "lg-email-err" : undefined}
            className="field"
          />
          <FieldError id="lg-email-err" text={emailErr} />
        </label>
        <div className="flex flex-col gap-2">
          <span className="flex items-center justify-between gap-2.5">
            <label htmlFor="lg-pw" className={label}>
              {t.login.pw}
            </label>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-blue hover:text-red"
            >
              {t.login.forgot}
            </button>
          </span>
          <span className="relative block">
            <input
              id="lg-pw"
              name="pw"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              aria-invalid={!!pwErr}
              aria-describedby={pwErr ? "lg-pw-err" : undefined}
              className="field pr-[52px]"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? t.login.hidePw : t.login.showPw}
              aria-pressed={show}
              className="absolute right-0.5 top-0.5 grid size-11 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2"
            >
              <AIcon name={show ? "eyeOff" : "eye"} />
            </button>
          </span>
          <FieldError id="lg-pw-err" text={pwErr} />
        </div>
        <label className="flex min-h-8 cursor-pointer items-center gap-2.5 text-[14.5px] text-ink2">
          <input type="checkbox" name="remember" defaultChecked className="size-[18px] accent-[var(--blue-solid)]" />
          {t.login.remember}
        </label>
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy && <Spinner />}
          {t.login.submit}
        </button>
      </form>
      {process.env.NODE_ENV !== "production" && <p className="m-0 text-center text-[13px] text-ink3">{t.login.demo}</p>}
    </>
  );
}
