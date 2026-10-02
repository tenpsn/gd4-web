"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { btn, FieldError, Modal, useToast } from "@/admin/ui";
import type { Category } from "@/types/site";
import { saveCategories } from "../../actions/products";

/** หน้าต่างจัดการหมวดหมู่ เปลี่ยนชื่อ เรียงลำดับ เพิ่ม และลบ แล้วบันทึกเมื่อกดเสร็จสิ้น */
export function CategoriesModal({ categories, counts, onClose }: { categories: Category[]; counts: Record<string, number>; onClose: () => void }) {
  const { t } = useAdmin();
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<Category[]>(() => categories.map((c) => ({ ...c, name: { ...c.name } })));
  const [newTh, setNewTh] = useState("");
  const [newEn, setNewEn] = useState("");
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();
  const dragFrom = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    setList((l) => {
      const n = [...l];
      const [x] = n.splice(from, 1);
      n.splice(to, 0, x);
      return n;
    });
  };
  const rename = (i: number, k: "th" | "en", v: string) => setList((l) => l.map((c, j) => (j === i ? { ...c, name: { ...c.name, [k]: v } } : c)));
  const remove = (i: number) => {
    const c = list[i];
    if (counts[c.id]) {
      toast("err", t.toast.catInUse);
      return;
    }
    setList((l) => l.filter((_, j) => j !== i));
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTh.trim() || !newEn.trim()) {
      setErr(true);
      return;
    }
    const base = newEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "cat";
    let id = base;
    for (let n = 2; list.some((c) => c.id === id); n++) id = `${base}-${n}`;
    setList((l) => [...l, { id, name: { th: newTh.trim(), en: newEn.trim() } }]);
    setNewTh("");
    setNewEn("");
    setErr(false);
    toast("ok", t.toast.catAdded);
  };
  const done = () =>
    start(async () => {
      const res = await saveCategories(list);
      if (!res.ok) {
        toast("err", res.error === "catInUse" ? t.toast.catInUse : t.cats.errBoth);
        return;
      }
      router.refresh();
      onClose();
    });

  const inp = "min-h-[42px] min-w-0 flex-[1_1_150px] rounded-lg border border-line bg-field px-2.5 py-2 text-[14.5px] text-ink outline-none focus:border-blue-solid";

  return (
    <Modal open onClose={onClose} width={640} title={t.cats.title} sub={t.cats.sub} footer={<button type="button" onClick={done} disabled={pending} className={btn.primary}>{t.c.done}</button>}>
      <div className="flex flex-col gap-2 px-6 py-4">
        {list.map((c, i) => (
          <div
            key={c.id}
            onDragEnter={() => {
              if (dragFrom.current !== null && dragFrom.current !== i) {
                move(dragFrom.current, i);
                dragFrom.current = i;
                setDragging(i);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-surface2 p-2 transition-opacity ${dragging === i ? "opacity-40" : ""}`}
          >
            <span
              draggable
              onDragStart={() => {
                dragFrom.current = i;
                setDragging(i);
              }}
              onDragEnd={() => {
                dragFrom.current = null;
                setDragging(null);
              }}
              title={t.content.drag}
              className="grid h-11 w-6 cursor-grab place-items-center text-ink3"
            >
              <AIcon name="drag" />
            </span>
            <input value={c.name.th} onChange={(e) => rename(i, "th", e.target.value)} aria-label={t.cats.nameTh} className={inp} />
            <input value={c.name.en} onChange={(e) => rename(i, "en", e.target.value)} aria-label={t.cats.nameEn} className={inp} />
            <span className="min-w-16 text-[12.5px] text-ink3">
              {counts[c.id] ?? 0} {t.cats.count}
            </span>
            <button type="button" onClick={() => move(i, i - 1)} aria-label={t.c.up} className={btn.icon}>
              <AIcon name="chevU" />
            </button>
            <button type="button" onClick={() => move(i, i + 1)} aria-label={t.c.down} className={btn.icon}>
              <AIcon name="chevD" />
            </button>
            <button type="button" onClick={() => remove(i)} aria-label={t.c.del} className={btn.iconDanger}>
              <AIcon name="trash" />
            </button>
          </div>
        ))}
        <form onSubmit={add} className="mt-1.5 flex flex-wrap gap-2 border-t border-line pt-3.5">
          <input value={newTh} onChange={(e) => setNewTh(e.target.value)} placeholder={t.cats.nameTh} aria-invalid={err && !newTh.trim()} className={`${inp} min-h-11`} />
          <input value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder={t.cats.nameEn} aria-invalid={err && !newEn.trim()} className={`${inp} min-h-11`} />
          <button type="submit" className={`${btn.primary} min-h-11 px-4 text-[14.5px]`}>
            <AIcon name="plus" />
            {t.cats.add}
          </button>
        </form>
        <FieldError text={err && t.cats.errBoth} />
      </div>
    </Modal>
  );
}
