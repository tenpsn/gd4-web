import type { LText, MenuItem, Page } from "@/types/site";

/** ปรับเมนูหลักให้ตรงกับสวิตช์แสดงในเมนูของแต่ละหน้า ใช้ทั้งหน้าแก้ไข ตอนเผยแพร่ และหน้าดูตัวอย่าง */
export function syncMenu(menu: MenuItem[], pages: Page[]): MenuItem[] {
  const out = menu.filter((m) => {
    const pg = pages.find((p) => p.slug === m.url);
    return !pg || pg.inMenu;
  });
  for (const p of pages) {
    if (p.inMenu && !out.some((m) => m.url === p.slug)) out.push({ id: `m-${p.id}`, label: p.title, url: p.slug });
  }
  return out;
}

/** ตั้งสวิตช์แสดงในเมนูของแต่ละหน้าตามเมนูหลัก ใช้ตอนแก้เมนูในแท็บส่วนกลาง */
export function syncInMenu(pages: Page[], menu: MenuItem[]): Page[] {
  return pages.map((p) => {
    const on = menu.some((m) => m.url === p.slug);
    return on === !!p.inMenu ? p : { ...p, inMenu: on };
  });
}

/**
 * ทำให้สวิตช์กับเมนูหลักตรงกันตอนโหลดและตอนเผยแพร่
 * หน้าที่มีปุ่มอยู่ในเมนูแล้วถือว่าเปิดสวิตช์ เพราะข้อมูลเก่าของหน้าหลักไม่ได้เก็บค่าสวิตช์ไว้
 */
export function alignMenu(pages: Page[], menu: MenuItem[]): { pages: Page[]; menu: MenuItem[] } {
  const fixed = pages.map((p) => (!p.inMenu && menu.some((m) => m.url === p.slug) ? { ...p, inMenu: true } : p));
  return { pages: fixed, menu: syncMenu(menu, fixed) };
}

/** เปลี่ยนชื่อหรือลิงก์ของหน้าแล้ว ปุ่มในเมนูที่ชี้ไปหน้านั้นเปลี่ยนตาม ชื่อปุ่มเปลี่ยนเฉพาะภาษาที่ยังตรงกับชื่อหน้าเดิม */
export function renameInMenu(menu: MenuItem[], before: Page, after: Page): MenuItem[] {
  const label = (cur: LText): LText => ({
    th: cur.th === before.title.th ? after.title.th : cur.th,
    en: cur.en === before.title.en ? after.title.en : cur.en,
  });
  return menu.map((m) => (m.url === before.slug ? { ...m, url: after.slug, label: label(m.label) } : m));
}
