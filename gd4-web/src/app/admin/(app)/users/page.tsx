import type { Metadata } from "next";
import { can, requireUser, toPublic } from "@/server/auth";
import { readDb } from "@/server/store";
import { Users } from "./Users";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireUser("users");
  const db = readDb();
  return (
    <Users
      me={me.id}
      users={db.users.map(toPublic)}
      perms={db.perms}
      activity={db.activity.slice(0, 300)}
      canEdit={can(me, "users", "edit")}
      canDel={can(me, "users", "del")}
    />
  );
}
