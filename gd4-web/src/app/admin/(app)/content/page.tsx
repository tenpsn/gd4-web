import type { Metadata } from "next";
import { Editor } from "@/admin/editor/Editor";
import { can, requireUser } from "@/server/auth";
import { working } from "@/server/content";
import { readDb } from "@/server/store";

export const metadata: Metadata = { title: "Website content" };

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const user = await requireUser("content");
  const sp = await searchParams;
  const db = await readDb();
  return (
    <Editor
      mode="content"
      initial={working(db)}
      hasDraft={!!db.draft}
      initialRev={db.draftRev}
      categories={db.categories}
      initialPage={typeof sp.page === "string" ? sp.page : "home"}
      perms={{
        contentEdit: can(user, "content", "edit"),
        contentPublish: can(user, "content", "publish"),
        contentDel: can(user, "content", "del"),
        designView: can(user, "design"),
        designEdit: can(user, "design", "edit"),
        designPublish: can(user, "design", "publish") || can(user, "content", "publish"),
      }}
    />
  );
}
