"use client";

import { useState } from "react";
import { sendContact } from "@/app/actions/contact";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";
import { EMPTY_CONTACT, validateContact, type ContactErrors, type ContactField, type ContactInput } from "@/lib/contact";

type Status = "idle" | "sending" | "ok" | "err";

export function ContactForm({ heading }: { heading: string }) {
  const { t } = useI18n();
  const [f, setF] = useState<ContactInput>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = (k: ContactField, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const er = validateContact(f, consent);
    setErrors(er);
    if (Object.keys(er).length) {
      const first = Object.keys(er)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await sendContact(new FormData(e.currentTarget));
      if (res.ok) {
        setStatus("ok");
        return;
      }
      if (res.errors) setErrors(res.errors);
      setStatus(res.errors ? "idle" : "err");
    } catch {
      // ถ้าเน็ตมีปัญหา ข้อความที่กรอกไว้ยังอยู่ในฟอร์ม
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div role="status" className="flex flex-col items-center gap-3.5 px-2.5 py-10 text-center [animation:s-pop_.5s_cubic-bezier(.34,1.56,.64,1)_both]">
        <span className="grid size-[72px] place-items-center rounded-full bg-ok-soft text-ok">
          <Icon name="check" />
        </span>
        <h3 className="m-0 font-head text-h3 font-semibold">{t.c.okT}</h3>
        <p className="m-0 max-w-[360px] text-ink2">{t.c.okD}</p>
        <button
          type="button"
          onClick={() => {
            setF(EMPTY_CONTACT);
            setConsent(false);
            setErrors({});
            setStatus("idle");
          }}
          className="min-h-11 cursor-pointer rounded-btn border border-line bg-transparent px-[18px] font-semibold text-ink"
        >
          {t.c.again}
        </button>
      </div>
    );
  }

  const fields: [ContactField, string, boolean, string][] = [
    ["name", t.c.name, true, "text"],
    ["company", t.c.company, false, "text"],
    ["phone", t.c.fphone, true, "tel"],
    ["email", t.c.femail, false, "email"],
  ];
  const auto: Partial<Record<ContactField, string>> = { name: "name", company: "organization", phone: "tel", email: "email" };
  const inputCls = (k: ContactField) =>
    `w-full rounded-input border bg-bg text-body text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary-solid focus:shadow-[0_0_0_3px_var(--c-soft)] ${
      errors[k] ? "border-err" : "border-line"
    }`;
  const errText = (k: ContactField | "consent") =>
    errors[k] && (
      <span id={`cf-${k}-err`} className="text-[13px] text-err [animation:s-up_.25s_both]">
        {t.c[errors[k]!]}
      </span>
    );
  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h3 className="m-0 font-head text-h3 font-semibold">{heading}</h3>

      {status === "err" && (
        <div role="alert" className="flex gap-3 rounded-ctl bg-err-soft p-3.5 text-err [animation:s-up_.35s_both]">
          <Icon name="alert" />
          <span className="flex flex-col gap-1">
            <strong className="text-[15px]">{t.c.errT}</strong>
            <span className="text-sm leading-[1.55]">{t.c.errD}</span>
          </span>
        </div>
      )}

      {/* ช่องดักบอท ซ่อนไว้ไม่ให้คนเห็นและโปรแกรมอ่านหน้าจอไม่อ่าน */}
      {/* ใช้ชื่อที่เบราว์เซอร์ไม่รู้จัก ถ้าใช้ชื่อทั่วไปอย่าง website เบราว์เซอร์จะกรอกให้เองแล้วข้อความของคนจริงจะหายไป */}
      <input type="text" name="gd4_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {fields.map(([k, label, req, type]) => (
          <label key={k} className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-semibold">
              {label}
              {req && <span className="text-accent"> *</span>}
            </span>
            <input
              name={k}
              type={type}
              value={f[k]}
              onChange={(e) => set(k, e.target.value)}
              required={req}
              autoComplete={auto[k]}
              inputMode={type === "tel" ? "tel" : undefined}
              aria-invalid={!!errors[k]}
              aria-describedby={errors[k] ? `cf-${k}-err` : undefined}
              className={`min-h-12 px-3.5 ${inputCls(k)}`}
            />
            {errText(k)}
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">
          {t.c.msg}
          <span className="text-accent"> *</span>
        </span>
        <textarea
          name="msg"
          rows={5}
          value={f.msg}
          onChange={(e) => set("msg", e.target.value)}
          required
          aria-invalid={!!errors.msg}
          aria-describedby={errors.msg ? "cf-msg-err" : undefined}
          className={`resize-y px-3.5 py-3 leading-[1.6] ${inputCls("msg")}`}
        />
        {errText("msg")}
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-[1.6] text-ink2">
          <input
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrors((x) => ({ ...x, consent: undefined }));
            }}
            required
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "cf-consent-err" : undefined}
            className="mt-[3px] size-[18px] flex-none cursor-pointer accent-[var(--c-primary-solid)]"
          />
          <span>
            {t.c.consent}
            <span className="text-accent"> *</span>
          </span>
        </label>
        {errText("consent")}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-btn border-0 bg-accent-solid text-btn font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[.99] disabled:cursor-wait"
      >
        {sending ? (
          <>
            <span className="size-[18px] rounded-full border-2 border-white/35 border-t-white [animation:s-spin_.7s_linear_infinite]" />
            {t.c.sending}
          </>
        ) : (
          t.c.send
        )}
      </button>
    </form>
  );
}
