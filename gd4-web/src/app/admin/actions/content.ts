"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan, can, getCurrentUser } from "@/server/auth";
import { cleanDesign, cleanGlobal, cleanPage, globalOf, working } from "@/server/content";
import { mutate, nowStr, readDb } from "@/server/store";
import type { Working } from "@/server/types";
import type { LText, MenuItem } from "@/types/site";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * บันทึกงานที่กำลังแก้เป็นฉบับร่าง ใช้กับการดูตัวอย่างและปุ่มบันทึกร่าง
 * แก้เนื้อหาต้องมีสิทธิ์แก้เนื้อหา แก้ธีมต้องมีสิทธิ์แก้ดีไซน์
 */
export type SaveDraftResult = { ok: true; rev: number } | { ok: false; conflict: true; who: LText; when: string };

export async function saveDraft(input: Working, baseRev: number): Promise<SaveDraftResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Forbidden");
  const db = readDb();
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

  const rev = mutate((d) => {
    d.draft = { ...next, userId: user.id, when: nowStr() };
    return ++d.draftRev;
  });
  return { ok: true, rev };
}

export async function discardDraft() {
  await assertCan("content", "edit");
  mutate((d) => {
    d.draft = null;
    d.draftRev++;
  });
  return { ok: true };
}

/** เผยแพร่ฉบับร่างขึ้นเว็บจริง เก็บเป็นเวอร์ชันไว้ และรีเฟรชหน้าเว็บ */
export async function publish(note?: LText): Promise<{ ok: boolean; error?: "forbidden"; rev?: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Forbidden");
  const db = readDb();
  if (!db.draft) return { ok: true, rev: db.draftRev };
  const w = working(db);
  const contentChanged = !same(w.pages, db.pages) || !same(w.global, globalOf(db.settings));
  const designChanged = !same(w.design, db.design);
  if ((contentChanged && !can(user, "content", "publish")) || (designChanged && !can(user, "design", "publish") && !can(user, "content", "publish"))) {
    return { ok: false, error: "forbidden" };
  }

  mutate((d) => {
    const draft = d.draft!;
    // ปรับเมนูหลักให้ตรงกับสวิตช์แสดงในเมนูของแต่ละหน้า
    const menu: MenuItem[] = draft.global.menu.filter((m) => {
      const pg = draft.pages.find((p) => p.slug === m.url);
      return !pg || pg.inMenu || pg.system;
    });
    for (const p of draft.pages) {
      if (p.inMenu && !p.system && !menu.some((m) => m.url === p.slug)) menu.push({ id: `m-${p.id}`, label: p.title, url: p.slug });
    }
    const global = { ...draft.global, menu };
    const changed = draft.pages.find((p) => !same(p, d.pages.find((x) => x.id === p.id))) ?? draft.pages[0];

    d.pages = draft.pages;
    d.design = draft.design;
    Object.assign(d.settings, global);
    const v = Math.max(0, ...d.versions.map((x) => x.v)) + 1;
    const autoNote = note?.th ? note : designChanged && !contentChanged ? { th: "ปรับธีมและตัวอักษร", en: "Updated theme & type" } : { th: `เผยแพร่หน้า${changed.title.th}`, en: `Published ${changed.title.en}` };
    d.versions.unshift({ v, when: nowStr(), userId: user.id, note: autoNote, pages: draft.pages, design: draft.design, global });
    d.versions = d.versions.slice(0, 30);
    d.lastEdit = { page: changed.id, userId: user.id, when: nowStr() };
    logActivity(d, user.id, "pubPage", changed.title);
    d.draft = null;
    d.draftRev++;
  });
  revalidatePath("/", "layout");
  return { ok: true, rev: readDb().draftRev };
}

/** นำเวอร์ชันเก่ามาใส่ในฉบับร่าง เพื่อตรวจก่อนแล้วค่อยเผยแพร่ */
export async function restoreVersion(v: number): Promise<{ ok: boolean }> {
  const user = await assertCan("content", "edit");
  const ver = readDb().versions.find((x) => x.v === Number(v));
  if (!ver) return { ok: false };
  mutate((d) => {
    d.draft = { pages: structuredClone(ver.pages), design: structuredClone(ver.design), global: structuredClone(ver.global), userId: user.id, when: nowStr() };
    d.draftRev++;
  });
  return { ok: true };
}

export async function listVersions() {
  if (!(await getCurrentUser())) throw new Error("Forbidden");
  const db = readDb();
  return db.versions.map(({ v, when, userId, note }) => ({ v, when, note, who: db.users.find((u) => u.id === userId)?.name ?? { th: "—", en: "—" } }));
}
