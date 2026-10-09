import type { Metadata } from "next";
import { Editor } from "@/admin/editor/Editor";
import { can, requireUser } from "@/server/auth";
import { working } from "@/server/content";
import { readDb } from "@/server/store";

export const metadata: Metadata = { title: "Theme & type" };

export default async function DesignPage() {
  const user = await requireUser("design");
  const db = await readDb();
  return (
    <Editor
      mode="design"
      initial={working(db)}
      hasDraft={!!db.draft}
      initialRev={db.draftRev}
      categories={db.categories}
      initialPage="home"
      perms={{
        contentEdit: can(user, "content", "edit"),
        contentPublish: can(user, "content", "publish"),
        contentDel: can(user, "content", "del"),
        designView: true,
        designEdit: can(user, "design", "edit"),
        designPublish: can(user, "design", "publish") || can(user, "content", "publish"),
      }}
    />
  );
}
