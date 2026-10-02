"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AIcon, type AIconName } from "./AIcon";
import { useAdmin } from "./context";

/* รูปแบบปุ่ม */
export const btn = {
  primary:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-blue-solid px-[18px] text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-blue-h hover:text-white active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60",
  outline:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-[15px] font-medium text-ink transition-[border-color,color,transform] duration-200 hover:border-blue-solid hover:text-blue active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-red-solid px-[18px] text-[15px] font-semibold text-white active:scale-[.98] disabled:opacity-60",
  icon: "grid size-[38px] cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 transition-colors hover:bg-soft hover:text-blue",
  iconDanger: "grid size-[38px] cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 transition-colors hover:bg-red-soft hover:text-red",
  link: "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[14.5px] font-medium text-blue hover:text-red",
};

export const label = "text-sm font-semibold";
export const pageTitle = "m-0 text-[clamp(24px,3vw,30px)] font-bold";

export function FieldError({ id, text }: { id?: string; text?: string | false | null }) {
  if (!text) return null;
  return (
    <span id={id} className="flex items-center gap-1.5 text-[13px] text-red [animation:a-up_.25s_ease-out_both]">
      <AIcon name="alert" />
      {text}
    </span>
  );
}

export function Req() {
  return <span className="text-red"> *</span>;
}

/* ป้ายแสดงสถานะ */
const TONES = {
  green: "bg-green-soft text-green",
  amber: "bg-amber-soft text-amber",
  blue: "bg-soft text-blue",
  red: "bg-red-soft text-red",
  gray: "bg-surface2 text-ink2 border border-line",
} as const;
export type Tone = keyof typeof TONES;

export function Pill({ tone, children, dot = true, small }: { tone: Tone; children: React.ReactNode; dot?: boolean; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"} ${TONES[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ข้อความแจ้งเตือนที่เด้งขึ้นมุมจอ */
type ToastItem = { id: number; type: "ok" | "err"; msg: string; action?: { label: string; run: () => void } };
const ToastCtx = createContext<(type: ToastItem["type"], msg: string, action?: ToastItem["action"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useAdmin();
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((s) => s.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (type: ToastItem["type"], msg: string, action?: ToastItem["action"]) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, type, msg, action }].slice(-4));
      window.setTimeout(() => dismiss(id), action ? 7000 : 4000);
    },
    [dismiss],
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-end gap-2.5 md2:left-auto md2:top-20 md2:bottom-auto" aria-live="polite">
        {items.map((x) => (
          <div
            key={x.id}
            role="status"
            className="pointer-events-auto relative flex w-full max-w-[380px] items-center gap-3 overflow-hidden rounded-[10px] border border-line bg-surface py-3 pl-4 pr-2.5 text-ink shadow-[0_14px_40px_-10px_rgba(0,0,0,.3)] [animation:a-toast_.4s_cubic-bezier(.2,.7,.2,1)_both]"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${x.type === "ok" ? "bg-green-solid" : "bg-red-solid"}`} />
            <span className={`grid size-7 flex-none place-items-center rounded-full text-white ${x.type === "ok" ? "bg-green-solid" : "bg-red-solid"}`}>
              <AIcon name={x.type === "ok" ? "check" : "alert"} size={16} />
            </span>
            <span className="flex-1 text-[14.5px] font-medium leading-[1.45]">{x.msg}</span>
            {x.action && (
              <button
                type="button"
                onClick={() => {
                  x.action!.run();
                  dismiss(x.id);
                }}
                className="inline-flex min-h-9 flex-none cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-soft px-3 text-sm font-bold text-blue hover:bg-blue-solid hover:text-white"
              >
                <AIcon name="undo" />
                {x.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(x.id)} aria-label={t.c.close} className="grid size-9 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink3 hover:bg-surface2">
              <AIcon name="x" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* หน้าต่างป๊อปอัป */
export function Modal({ open, onClose, width = 480, title, sub, children, footer, labelledBy }: {
  open: boolean;
  onClose: () => void;
  width?: number;
  title?: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  labelledBy?: string;
}) {
  const { t } = useAdmin();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // เลื่อนเคอร์เซอร์ไปที่ช่องหรือปุ่มแรกในหน้าต่าง
    window.setTimeout(() => ref.current?.querySelector<HTMLElement>("input,textarea,select,button:not([data-close])")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  const titleId = labelledBy ?? "modal-title";
  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--overlay)] p-4 [animation:a-fade_.25s_both]">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100%-32px)] w-full overflow-auto rounded-2xl bg-surface text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,.45)] [animation:a-pop_.4s_cubic-bezier(.34,1.56,.64,1)_both]"
        style={{ maxWidth: width }}
      >
        {title && (
          <div className="flex items-start gap-3 border-b border-line px-6 pb-3.5 pt-[22px]">
            <div className="flex flex-1 flex-col gap-1">
              <h2 id={titleId} className="m-0 text-[19px] font-bold">
                {title}
              </h2>
              {sub && <span className="text-sm leading-normal text-ink2">{sub}</span>}
            </div>
            <button type="button" data-close onClick={onClose} aria-label={t.c.close} className="grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 hover:bg-surface2">
              <AIcon name="x" />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-2.5 px-6 pb-[22px]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({ open, onClose, onOk, title, text, items, okLabel, cancelLabel, danger = true, icon = "trash" }: {
  open: boolean;
  onClose: () => void;
  onOk: () => void;
  title: string;
  text: string;
  items?: string[];
  okLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: AIconName;
}) {
  const { t } = useAdmin();
  return (
    <Modal open={open} onClose={onClose} width={440} labelledBy="cf-title">
      <div className="flex flex-col gap-4 p-7">
        <span className={`grid size-[52px] place-items-center rounded-full ${danger ? "bg-red-soft text-red" : "bg-amber-soft text-amber"}`}>
          <AIcon name={icon} size={22} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 id="cf-title" className="m-0 text-xl font-bold">
            {title}
          </h2>
          <p className="m-0 text-[15px] leading-[1.6] text-ink2">{text}</p>
        </div>
        {!!items?.length && (
          <ul className="m-0 flex max-h-40 list-none flex-col gap-1.5 overflow-auto rounded-[10px] border border-line bg-surface2 px-3.5 py-3">
            {items.map((x, i) => (
              <li key={i} className="text-[14.5px] font-semibold">
                {x}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" data-close onClick={onClose} className={btn.outline}>
            {cancelLabel ?? t.c.cancel}
          </button>
          <button type="button" onClick={onOk} className={danger ? btn.danger : btn.primary}>
            {okLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* สวิตช์เปิดปิด */
export function Switch({ on, onChange, label: text, hint, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex min-h-[60px] w-full cursor-pointer items-center gap-3.5 rounded-[10px] border border-line bg-surface2 px-3.5 py-3 text-left text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <strong className="text-[14.5px] font-semibold">{text}</strong>
        {hint && <span className="text-[13px] text-ink2">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 flex-none rounded-xl transition-colors duration-[250ms] ${on ? "bg-blue-solid" : "bg-line"}`}>
        <span
          className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ transform: `translateX(${on ? 20 : 0}px)` }}
        />
      </span>
    </button>
  );
}

/* การ์ดให้เลือกได้ทีละหนึ่งตัวเลือก ใช้เลือกสถานะและบทบาท */
export function RadioCard({ on, onPick, title, desc, disabled }: { on: boolean; onPick: () => void; title: string; desc?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      onClick={onPick}
      className={`flex min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3 text-left text-ink transition-[border-color,background-color] duration-[250ms] disabled:cursor-not-allowed disabled:opacity-60 ${
        on ? "border-blue-solid bg-soft" : "border-line bg-surface"
      }`}
    >
      <span className={`grid size-5 flex-none place-items-center rounded-full border-2 transition-colors ${on ? "border-blue-solid" : "border-ink3"}`}>
        <span className={`size-2.5 rounded-full bg-blue-solid transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${on ? "scale-100" : "scale-0"}`} />
      </span>
      <span className="flex flex-col gap-0.5">
        <strong className="text-[14.5px] font-semibold">{title}</strong>
        {desc && <span className="text-[13px] text-ink2">{desc}</span>}
      </span>
    </button>
  );
}

/* แถบเผยแพร่ที่แสดงใต้แถบด้านบนของหน้าแอดมิน */
export const PUBBAR_SLOT = "admin-pubbar-slot";
const noop = () => () => {};

export function PubBar({ state, ctx, onDraft, onPublish, busy, extra, canPublish = true, canDraft = true }: {
  state: "unsaved" | "saved" | "new";
  ctx?: string;
  onDraft?: () => void;
  onPublish?: () => void;
  busy?: boolean;
  extra?: React.ReactNode;
  canPublish?: boolean;
  canDraft?: boolean;
}) {
  const { t } = useAdmin();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const slot = mounted ? document.getElementById(PUBBAR_SLOT) : null;
  if (!slot) return null;
  const tone = state === "saved" ? "bg-green-soft text-green" : state === "new" ? "bg-soft text-blue" : "bg-amber-soft text-amber";
  return createPortal(
    <div className="relative z-[4] flex min-h-[58px] flex-none items-center gap-2.5 border-b border-line bg-surface px-3 py-2 shadow-[0_6px_16px_-14px_rgba(15,27,45,.35)] [animation:a-fade_.3s_both] md2:px-6">
      <span className={`inline-flex min-w-0 items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-full py-[5px] pl-2.5 pr-3 text-[13px] font-semibold transition-colors ${tone}`}>
        <span className={`size-2 flex-none rounded-full bg-current ${state === "unsaved" ? "[animation:a-pulse_1.4s_ease-out_infinite]" : ""}`} />
        <span className="overflow-hidden text-ellipsis">{t.pub[state === "new" ? "newItem" : state]}</span>
      </span>
      {ctx && <span className="hidden min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-ink2 md2:inline">{ctx}</span>}
      <span className="flex-1" />
      {extra}
      {onDraft && canDraft && (
        <button type="button" onClick={onDraft} disabled={busy} className={`${btn.outline} min-h-10 px-3.5 text-[14.5px]`}>
          {t.form.saveDraft}
        </button>
      )}
      {onPublish && canPublish && (
        <button type="button" onClick={onPublish} disabled={busy} className={`${btn.primary} min-h-10 px-4 text-[14.5px]`}>
          <AIcon name="check" />
          {t.form.publish}
        </button>
      )}
    </div>,
    slot,
  );
}

/* กันไม่ให้ออกจากหน้าโดยลืมบันทึก */
let dirtyFlag = false;
export const isDirty = () => dirtyFlag;

/** บอกว่าหน้านี้มีการแก้ไขที่ยังไม่บันทึก ระบบจะถามก่อนออกและเบราว์เซอร์จะเตือนก่อนปิด */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    dirtyFlag = dirty;
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => {
      dirtyFlag = false;
      window.removeEventListener("beforeunload", onBefore);
    };
  }, [dirty]);
}

/* ตัวช่วยอัปโหลดไฟล์ */
export type Uploaded = { src: string; name: string; size: number };

export async function uploadFile(file: File, kind: "image" | "pdf" | "font"): Promise<Uploaded | { error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    return (await res.json()) as Uploaded | { error: string };
  } catch {
    return { error: "network" };
  }
}

export const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
