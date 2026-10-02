import { Icon } from "@/components/Icon";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import type { ContactSection, IconName, Locale, SiteSettings } from "@/types/site";
import { ContactForm } from "./ContactForm";

export function Contact({ s, lang, settings }: { s: ContactSection; lang: Locale; settings: SiteSettings }) {
  const t = getDict(lang);
  const c = settings.contact;
  const info: [IconName, string, React.ReactNode][] = [
    ["pin", t.c.address, tx(c.address, lang)],
    ["phone", t.c.phone, <a key="p" href={`tel:${c.phone.replace(/\D/g, "")}`} className="text-ink hover:text-primary">{c.phone}</a>],
    ["mail", t.c.email, <a key="e" href={`mailto:${c.email}`} className="text-ink hover:text-primary">{c.email}</a>],
    ["clock", t.c.hours, tx(c.hours, lang)],
  ];
  const map = `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;

  return (
    <div className="sec grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-3.5">
        {info.map(([icon, label, value]) => (
          <div key={label} className="flex gap-3.5 rounded-card border border-line bg-card p-4">
            <span className="grid size-[42px] flex-none place-items-center rounded-[10px] bg-soft text-primary">
              <Icon name={icon} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] text-ink3">{label}</span>
              <span className="text-body leading-[1.6] [overflow-wrap:anywhere]">{value}</span>
            </span>
          </div>
        ))}
        {/* ภาพแผนที่ตัวอย่างตามดีไซน์ คลิกแล้วเปิด Google Maps ที่พิกัดที่บันทึกไว้ */}
        <a
          href={map}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.openMap}
          className="grid h-[220px] place-items-center rounded-card"
          style={{
            background:
              "repeating-linear-gradient(0deg,var(--c-ph1) 0 1px,transparent 1px 36px),repeating-linear-gradient(90deg,var(--c-ph1) 0 1px,var(--c-ph2) 1px 36px)",
          }}
        >
          <span className="grid size-12 place-items-center rounded-full bg-accent-solid text-white shadow-[0_8px_20px_rgba(200,49,42,.35)]">
            <Icon name="pin" />
          </span>
        </a>
      </div>
      <div className="rounded-card border border-line bg-card p-[clamp(20px,3vw,32px)] text-ink">
        <ContactForm heading={tx(s.heading, lang)} />
      </div>
    </div>
  );
}
