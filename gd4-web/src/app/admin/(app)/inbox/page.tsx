import type { Metadata } from "next";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { Inbox } from "./Inbox";

export const metadata: Metadata = { title: "Messages" };

export default async function InboxPage({ searchParams }: PageProps<"/admin/inbox">) {
  const user = await requireUser("inbox");
  const sp = await searchParams;
  const filter = ["new", "read", "replied"].includes(String(sp.filter)) ? (String(sp.filter) as "new" | "read" | "replied") : "all";
  const messages = [...(await readDb()).messages].sort((a, b) => b.date.localeCompare(a.date));
  return <Inbox messages={messages} initialFilter={filter} canEdit={can(user, "inbox", "edit")} canDel={can(user, "inbox", "del")} />;
}
