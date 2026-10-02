import { LocalLink } from "@/components/LocalLink";
import { Logo } from "@/components/Logo";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import type { Locale, SiteSettings, SocialPlatform } from "@/types/site";

const PLATFORMS: Record<SocialPlatform, [name: string, abbr: string, color: string]> = {
  facebook: ["Facebook", "f", "#1877f2"],
  line: ["LINE", "L", "#06c755"],
  youtube: ["YouTube", "▶", "#e62117"],
  instagram: ["Instagram", "IG", "#d6249f"],
  linkedin: ["LinkedIn", "in", "#0a66c2"],
  tiktok: ["TikTok", "TT", "#161823"],
  x: ["X", "X", "#161823"],
};

export function Footer({ settings, lang }: { settings: SiteSettings; lang: Locale }) {
  const t = getDict(lang);
  const { contact } = settings;
  return (
    <footer className="bg-footer text-small text-footer-ink">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-[var(--sec-px)] pb-7 pt-[calc(var(--sec-py)*.7)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex max-w-[360px] flex-col gap-3.5">
          <span className="flex items-center gap-2.5">
            <Logo size={42} />
            <strong className="font-head text-[17px] text-white">{tx(settings.siteName, lang)}</strong>
          </span>
          <span className="leading-[1.7]">{tx(settings.footer.body, lang)}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <strong className="text-[15px] text-white">{t.menu}</strong>
          {settings.menu.map((m) => (
            <LocalLink key={m.id} href={m.url} className="w-fit text-footer-ink hover:text-white">
              {tx(m.label, lang)}
            </LocalLink>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <strong className="text-[15px] text-white">{t.contact}</strong>
          <span className="leading-[1.6]">{tx(contact.address, lang)}</span>
          <a href={`tel:${contact.phone.replace(/\D/g, "")}`} className="text-footer-ink hover:text-white">
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="text-footer-ink [overflow-wrap:anywhere] hover:text-white">
            {contact.email}
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <strong className="text-[15px] text-white">{t.follow}</strong>
          <div className="flex flex-wrap gap-2.5">
            {settings.socials.map((s) => {
              const [name, abbr, color] = PLATFORMS[s.platform];
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={name}
                  aria-label={name}
                  className="grid size-[42px] place-items-center rounded-full text-[13px] font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,.18)] transition-transform duration-[250ms] ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-[3px] hover:text-white"
                  style={{ background: color }}
                >
                  {abbr}
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] border-t border-white/10 px-[var(--sec-px)] pb-[26px] pt-[18px] text-[13px]">
        {tx(settings.footer.copyright, lang)}
      </div>
    </footer>
  );
}
