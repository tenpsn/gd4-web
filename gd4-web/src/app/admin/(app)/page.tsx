import type { Metadata } from "next";
import Link from "next/link";
import { AIcon, type AIconName } from "@/admin/AIcon";
import { avatarColor } from "@/admin/avatar";
import { getAdminDict, relDate, todayLine } from "@/admin/i18n";
import { getAdminLang } from "@/admin/server";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";

export const metadata: Metadata = { title: "Dashboard" };

const btnOutline =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[15px] font-medium text-ink transition-[border-color,color,transform] hover:border-blue-solid hover:text-blue active:scale-[.98]";
const btnPrimary =
  "inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-solid px-[18px] text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-blue-h hover:text-white active:scale-[.98]";

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser("dashboard");
  const lang = await getAdminLang();
  const t = getAdminDict(lang);
  const db = readDb();
  const denied = (await searchParams).denied === "1";

  const userBy = (id: number) => db.users.find((u) => u.id === id);
  const products = db.products;
  const pub = products.filter((p) => p.status === "pub").length;
  const msgs = [...db.messages].sort((a, b) => b.date.localeCompare(a.date));
  const newCount = msgs.filter((m) => m.status === "new").length;
  const lastPage = db.pages.find((p) => p.id === db.lastEdit.page) ?? db.pages[0];
  const lastBy = userBy(db.lastEdit.userId);

  const cards: { label: string; value: string; sub: string; icon: AIconName; tone: string; href: string; small?: boolean; show: boolean }[] = [
    {
      label: t.dash.cProducts, value: String(products.length), sub: `${t.prod.pub} ${pub} · ${t.prod.draft} ${products.length - pub}`,
      icon: "box", tone: "bg-soft text-blue", href: "/admin/products", show: can(user, "products"),
    },
    {
      label: t.dash.cMsgs, value: String(newCount), sub: msgs[0] ? `${t.dash.latest} ${relDate(msgs[0].date, lang)}` : "—",
      icon: "inbox", tone: "bg-red-soft text-red", href: "/admin/inbox?filter=new", show: can(user, "inbox"),
    },
    {
      label: t.dash.cPage, value: lastPage.title[lang], sub: `${lastBy?.name[lang] ?? "—"} · ${relDate(db.lastEdit.when, lang)}`,
      icon: "page", tone: "bg-green-soft text-green", href: `/admin/content?page=${lastPage.id}`, small: true, show: can(user, "content"),
    },
  ];

  const activity = db.activity.slice(0, 7);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="anim-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[clamp(24px,3vw,30px)] font-bold leading-[1.25]">
            {t.dash.hello}
            {user.name[lang].split(" ")[0]}
          </h1>
          <p className="m-0 text-[15.5px] text-ink2">{todayLine(lang)}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {can(user, "content", "edit") && (
            <Link href="/admin/content?page=home" className={btnOutline}>
              <AIcon name="page" />
              {t.dash.editHome}
            </Link>
          )}
          {can(user, "products", "edit") && (
            <Link href="/admin/products/new" className={btnPrimary}>
              <AIcon name="plus" />
              {t.dash.addProduct}
            </Link>
          )}
        </div>
      </div>

      {denied && (
        <div role="alert" className="flex items-center gap-2.5 rounded-lg bg-amber-soft px-4 py-3 text-[14.5px] text-amber">
          <AIcon name="lock" />
          {t.dash.denied}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-4">
        {cards
          .filter((c) => c.show)
          .map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              style={{ animationDelay: `${i * 0.06}s` }}
              className="anim-up card relative flex flex-col gap-3 overflow-hidden p-[22px] text-left text-ink transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-transparent hover:text-ink hover:shadow-lift"
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="text-[14.5px] font-medium text-ink2">{c.label}</span>
                <span className={`grid size-10 place-items-center rounded-[10px] ${c.tone}`}>
                  <AIcon name={c.icon} size={20} />
                </span>
              </span>
              <span className={`font-bold leading-[1.15] tracking-[-.01em] tabular-nums ${c.small ? "text-[26px]" : "text-4xl"}`}>{c.value}</span>
              <span className="text-sm text-ink2">{c.sub}</span>
            </Link>
          ))}
      </div>

      <section className="card anim-up overflow-hidden [animation-delay:.15s]">
        <div className="flex items-center justify-between gap-3 px-[22px] py-[18px]">
          <h2 className="m-0 text-[17px] font-semibold">{t.dash.activity}</h2>
        </div>
        {activity.length ? (
          <ol className="m-0 list-none p-0">
            {activity.map((a, i) => {
              const u = userBy(a.userId);
              return (
                <li
                  key={a.id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  className="flex items-start gap-3.5 border-t border-line px-[22px] py-3.5 [animation:a-up_.45s_cubic-bezier(.2,.7,.2,1)_both]"
                >
                  <span
                    className="grid size-9 flex-none place-items-center rounded-full text-[12.5px] font-bold text-white"
                    style={{ background: u ? avatarColor(u.id) : "#6b778a" }}
                  >
                    {u?.ini[lang] ?? "?"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[15px] leading-[1.55]">
                      <strong className="font-semibold">{u?.name[lang] ?? "—"}</strong> {a.action[lang]}{" "}
                      <span className="font-medium text-blue">{a.target[lang]}</span>
                    </span>
                    <time className="text-[13px] text-ink3">{relDate(a.when, lang)}</time>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="border-t border-line px-[22px] py-10 text-center text-[15px] text-ink2">{t.dash.noAct}</div>
        )}
      </section>
    </div>
  );
}
