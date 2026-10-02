"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { FaqSection } from "@/types/site";
import { delay, H2 } from "./shared";

export function Faq({ s }: { s: FaqSection }) {
  const { lang } = useI18n();
  const uid = useId();
  // คำถามแรกเปิดไว้ตั้งแต่ต้นตามแบบดีไซน์
  const [open, setOpen] = useState<Record<string, boolean>>(() => (s.items[0] ? { [s.items[0].id]: true } : {}));

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-7 px-[var(--sec-px)] py-[var(--sec-py)]">
      <H2>{tx(s.heading, lang)}</H2>
      <div className="flex flex-col gap-2.5">
        {s.items.map((q, i) => {
          const isOpen = !!open[q.id];
          const panel = `${uid}-${q.id}`;
          return (
            <div key={q.id} style={delay(i)} className="rounded-card border border-line bg-card text-ink [animation:s-up_.45s_both]">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}
                className="flex w-full cursor-pointer items-center gap-4 border-0 bg-transparent px-5 py-[18px] text-left font-head text-[calc(var(--fs-body)*1.02)] font-semibold leading-[1.45] text-ink"
              >
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{tx(q.q, lang)}</span>
                <span
                  className={`grid size-[30px] flex-none place-items-center rounded-full bg-soft text-accent transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <Icon name="plus" />
                </span>
              </button>
              <div
                id={panel}
                role="region"
                className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)]"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                inert={!isOpen}
              >
                <div className="overflow-hidden">
                  <p className="m-0 px-5 pb-[18px] text-[calc(var(--fs-body)*.95)] leading-[1.75] text-ink2">{tx(q.a, lang)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
