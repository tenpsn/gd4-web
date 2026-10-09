import type { Metadata } from "next";
import { can, requireUser, toPublic } from "@/server/auth";
import { readDb } from "@/server/store";
import { Users } from "./Users";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireUser("users");
  const db = await readDb();
  return (
    <Users
      me={me.id}
      users={db.users.map(toPublic)}
      perms={db.perms}
      activity={can(me, "activity", "view") ? db.activity : []}
      canViewLog={can(me, "activity", "view")}
      canDelLog={can(me, "activity", "del")}
      canEdit={can(me, "users", "edit")}
      canDel={can(me, "users", "del")}
    />
  );
}
