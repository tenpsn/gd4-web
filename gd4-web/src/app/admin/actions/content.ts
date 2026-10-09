"use server";

import { revalidatePath } from "next/cache";
import { alignMenu } from "@/lib/menu";
import { same } from "@/lib/same";
import { logActivity } from "@/server/activity";
import { assertCan, can, getCurrentUser } from "@/server/auth";
import { cleanDesign, cleanGlobal, cleanPage, globalOf, working } from "@/server/content";
import { mutate, nowStr, readDb } from "@/server/store";
import type { Working } from "@/server/types";
import type { LText } from "@/types/site";


/**
 * บันทึกงานที่กำลังแก้เป็นฉบับร่าง ใช้กับการดูตัวอย่างและปุ่มบันทึกร่าง
 * แก้เนื้อหาต้องมีสิทธิ์แก้เนื้อหา แก้ธีมต้องมีสิทธิ์แก้ดีไซน์
 */
export type SaveDraftResult = { ok: true; rev: number } | { ok: false; conflict: true; who: LText; when: string };

export async function saveDraft(input: Working, baseRev: number): Promise<SaveDraftResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Forbidden");
  const db = await readDb();
  // มีคนอื่นหรือแท็บอื่นแก้ร่างไปแล้วหลังจากเปิดหน้านี้ จึงไม่บันทึกทับ
  if (Number(baseRev) !== db.draftRev) {
    const by = db.users.find((u) => u.id === db.draft?.userId);
    return { ok: false, conflict: true, who: by?.name ?? { th: "—", en: "—" }, when: db.draft?.when ?? "" };
  }
  const cur = working(db);

  const pages = (Array.isArray(input?.pages) ? input.pages : cur.pages).slice(0, 40).map((p) => cleanPage(p, cur.pages.find((x) => x.id === p?.id))).filter(Boolean) as Working["pages"];
  // หน้าระบบจะไม่ถูกลบทิ้งเด็ดขาด
  for (const sp of cur.pages.filter((p) => p.system)) if (!pages.some((p) => p.id === sp.id)) pages.push(sp);
  const next: Working = { pages, design: cleanDesign(input?.design), global: cleanGlobal(input?.global, cur.global) };

  const contentChanged = !same(next.pages, cur.pages) || !same(next.global, cur.global);
  const designChanged = !same(next.design, cur.design);
  if (contentChanged && !can(user, "content", "edit")) throw new Error("Forbidden");
  if (designChanged && !can(user, "design", "edit")) throw new Error("Forbidden");

  const rev = await mutate((d) => {
    d.draft = { ...next, userId: user.id, when: nowStr() };
    return ++d.draftRev;
  });
  return { ok: true, rev };
}

export async function discardDraft() {
  const me = await assertCan("content", "edit");
  await mutate((d) => {
    if (d.draft) logActivity(d, me.id, { th: "ทิ้งฉบับร่าง", en: "discarded draft" }, { th: "ฉบับร่างทั้งหมด", en: "all drafts" });
    d.draft = null;
    d.draftRev++;
  });
  return { ok: true };
}

/** เผยแพร่ฉบับร่างขึ้นเว็บจริง และรีเฟรชหน้าเว็บ */
export async function publish(): Promise<{ ok: boolean; error?: "forbidden"; rev?: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Forbidden");
  const db = await readDb();
  if (!db.draft) return { ok: true, rev: db.draftRev };
  const w = working(db);
  const contentChanged = !same(w.pages, db.pages) || !same(w.global, globalOf(db.settings));
  const designChanged = !same(w.design, db.design);
  if ((contentChanged && !can(user, "content", "publish")) || (designChanged && !can(user, "design", "publish") && !can(user, "content", "publish"))) {
    return { ok: false, error: "forbidden" };
  }

  await mutate((d) => {
    const draft = d.draft!;
    const { pages, menu } = alignMenu(draft.pages, draft.global.menu);
    const global = { ...draft.global, menu };
    // เทียบกับฉบับที่เผยแพร่อยู่ซึ่งจัดสวิตช์กับเมนูแบบเดียวกัน จะได้ไม่นับหน้าที่ไม่ได้แก้จริง
    const live = alignMenu(d.pages, d.settings.menu);
    const edited = pages.filter((p) => !same(p, live.pages.find((x) => x.id === p.id)));
    const removed = d.pages.filter((p) => !pages.some((x) => x.id === p.id));
    const changed = edited[0] ?? pages[0];
    // บันทึกแยกทีละเรื่องที่เปลี่ยน เพื่อให้รู้ว่าเผยแพร่อะไรไปบ้าง
    for (const p of edited) logActivity(d, user.id, "pubPage", p.title);
    for (const p of removed) logActivity(d, user.id, { th: "ลบหน้า", en: "deleted page" }, p.title);
    if (!same(draft.design, d.design)) logActivity(d, user.id, { th: "เผยแพร่การออกแบบ", en: "published design" }, { th: "ทั้งเว็บ", en: "whole site" });
    if (!same(global, { ...globalOf(d.settings), menu: live.menu })) logActivity(d, user.id, { th: "เผยแพร่ส่วนหัวและท้ายเว็บ", en: "published header and footer" }, { th: "ทั้งเว็บ", en: "whole site" });

    d.pages = pages;
    d.design = draft.design;
    Object.assign(d.settings, global);
    d.lastEdit = { page: changed.id, userId: user.id, when: nowStr() };
    d.draft = null;
    d.draftRev++;
  });
  revalidatePath("/", "layout");
  return { ok: true, rev: (await readDb()).draftRev };
}
