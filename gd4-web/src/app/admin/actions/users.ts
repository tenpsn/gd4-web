"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan } from "@/server/auth";
import { DEFAULT_PERMS } from "@/server/seed";
import { mutate, nextId, readDb } from "@/server/store";
import { ACTIONS, allowed, AREAS, ROLES, superOnly, type Perms, type Role } from "@/server/types";
import { baseUrl } from "@/server/url";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INVITE_DAYS = 7;

export type UserInput = { id: number | null; name: string; email: string; role: Role };
export type UserErrors = Partial<Record<"name" | "email", "errName" | "errEmail" | "errDup">>;
export type UserResult = { ok: true; inviteLink?: string } | { ok: false; errors?: UserErrors; error?: "noSelf" | "lastSuper" };

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** ชื่อย่อ ใช้อักษรตัวแรกของสองคำแรกในชื่อ */
function initials(name: string) {
  const parts = name.replace(/^(นาย|นาง|นางสาว|ดร\.|Dr\.?)\s*/, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

function newInvite() {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token), expires: Date.now() + INVITE_DAYS * 86400_000 };
}

/** สร้างลิงก์เชิญให้ผู้ดูแลคัดลอกไปส่งเอง */
const inviteLink = async (token: string) => ({ inviteLink: `${await baseUrl()}/admin/invite/${token}` });

const activeSupers = async (except?: number) => (await readDb()).users.filter((u) => u.role === "super" && u.status === "active" && u.id !== except).length;

export async function saveUser(input: UserInput): Promise<UserResult> {
  const me = await assertCan("users", "edit");
  const name = String(input.name ?? "").trim().slice(0, 120);
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 160);
  const role = ROLES.includes(input.role) ? input.role : "viewer";
  const id = input.id ? Number(input.id) : null;

  const errors: UserErrors = {};
  if (!name) errors.name = "errName";
  if (!EMAIL.test(email)) errors.email = "errEmail";
  else if ((await readDb()).users.some((u) => u.email.toLowerCase() === email && u.id !== id)) errors.email = "errDup";
  if (Object.keys(errors).length) return { ok: false, errors };

  if (id) {
    const cur = (await readDb()).users.find((u) => u.id === id);
    if (!cur) return { ok: false };
    // กันไม่ให้ผู้ดูแลสูงสุดคนสุดท้ายหรือตัวเองเสียสิทธิ์เต็มโดยไม่ตั้งใจ
    if (cur.role === "super" && role !== "super" && (id === me.id || (await activeSupers(id)) === 0)) return { ok: false, error: id === me.id ? "noSelf" : "lastSuper" };
    await mutate((db) => {
      const u = db.users.find((x) => x.id === id)!;
      const ini = initials(name);
      // บันทึกประวัติเฉพาะตอนที่มีการเปลี่ยนจริง
      if (u.name.th !== name || u.email !== email || u.role !== role) logActivity(db, me.id, { th: "แก้ข้อมูลผู้ดูแล", en: "edited admin" }, { th: name, en: name });
      Object.assign(u, { name: { th: name, en: name }, ini: { th: ini, en: ini }, email, role });
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  }

  const inv = newInvite();
  await mutate((db) => {
    const ini = initials(name);
    db.users.push({
      id: nextId(db.users), name: { th: name, en: name }, ini: { th: ini, en: ini }, email, role,
      status: "invited", lastActive: null, passwordHash: null, inviteHash: inv.hash, inviteExpires: inv.expires,
    });
    logActivity(db, me.id, { th: "เพิ่มผู้ดูแล", en: "added admin" }, { th: name, en: name });
  });
  revalidatePath("/admin", "layout");
  return { ok: true, ...(await inviteLink(inv.token)) };
}

export async function resendInvite(id: number): Promise<UserResult> {
  const me = await assertCan("users", "edit");
  const inv = newInvite();
  const u = await mutate((db) => {
    const u = db.users.find((x) => x.id === Number(id));
    if (!u || u.status !== "invited") return null;
    Object.assign(u, { inviteHash: inv.hash, inviteExpires: inv.expires });
    logActivity(db, me.id, { th: "ส่งคำเชิญอีกครั้ง", en: "resent invite" }, u.name);
    return { name: u.name.th, email: u.email };
  });
  if (!u) return { ok: false };
  return { ok: true, ...(await inviteLink(inv.token)) };
}

export async function setUserStatus(id: number, status: "active" | "suspended"): Promise<UserResult> {
  const me = await assertCan("users", "edit");
  if (Number(id) === me.id) return { ok: false, error: "noSelf" };
  const u = (await readDb()).users.find((x) => x.id === Number(id));
  if (!u || u.status === "invited") return { ok: false };
  if (status === "suspended" && u.role === "super" && (await activeSupers(u.id)) === 0) return { ok: false, error: "lastSuper" };
  await mutate((db) => {
    db.users.find((x) => x.id === u.id)!.status = status;
    const act = status === "suspended" ? { th: "ระงับผู้ดูแล", en: "suspended admin" } : { th: "เปิดใช้ผู้ดูแล", en: "reactivated admin" };
    logActivity(db, me.id, act, u.name);
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteUser(id: number): Promise<UserResult> {
  const me = await assertCan("users", "del");
  if (Number(id) === me.id) return { ok: false, error: "noSelf" };
  const u = (await readDb()).users.find((x) => x.id === Number(id));
  if (!u) return { ok: false };
  if (u.role === "super" && (await activeSupers(u.id)) === 0) return { ok: false, error: "lastSuper" };
  await mutate((db) => {
    db.users = db.users.filter((x) => x.id !== u.id);
    logActivity(db, me.id, { th: "ลบผู้ดูแล", en: "deleted admin" }, u.name);
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** บันทึกตารางสิทธิ์ ผู้ดูแลสูงสุดมีสิทธิ์ครบทุกอย่างเสมอ */
export async function savePerms(perms: Perms): Promise<{ ok: true }> {
  const me = await assertCan("users", "edit");
  const clean = structuredClone(DEFAULT_PERMS);
  for (const r of ROLES) {
    if (r === "super") continue;
    for (const a of AREAS) for (const x of ACTIONS) clean[r][a][x] = allowed(a, x) && !superOnly(a, x) && !!perms?.[r]?.[a]?.[x];
    // มีสิทธิ์ทำอย่างใดอย่างหนึ่ง ก็ต้องมีสิทธิ์ดูด้วย
    for (const a of AREAS) if (ACTIONS.some((x) => x !== "view" && clean[r][a][x])) clean[r][a].view = true;
  }
  await mutate((db) => {
    db.perms = clean;
    logActivity(db, me.id, "perm", { th: "บทบาททั้งหมด", en: "all roles" });
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** หน้าคำเชิญ ตั้งรหัสผ่านจากลิงก์เชิญที่ยังใช้ได้ */
export async function acceptInvite(token: string, password: string): Promise<{ ok: boolean; error?: "expired" | "errNw" }> {
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) return { ok: false, error: "errNw" };
  const { hashPassword } = await import("@/server/password");
  const hash = hashToken(String(token));
  const ok = await mutate((db) => {
    const u = db.users.find((x) => x.inviteHash === hash);
    if (!u || (u.inviteExpires ?? 0) < Date.now()) return false;
    u.passwordHash = hashPassword(password);
    u.status = "active";
    delete u.inviteHash;
    delete u.inviteExpires;
    logActivity(db, u.id, { th: "ตอบรับคำเชิญ", en: "accepted invite" }, u.name);
    return true;
  });
  return ok ? { ok: true } : { ok: false, error: "expired" };
}
