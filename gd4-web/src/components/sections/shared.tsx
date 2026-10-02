import type { SectionBg } from "@/types/site";

export const BG: Record<SectionBg, string> = {
  white: "bg-bg text-ink heading-ink",
  gray: "bg-bg2 text-ink heading-ink",
  blue: "bg-soft text-ink heading-ink",
  navy: "bg-panel text-white",
};

export function SectionShell({ bg = "white", anchor, label, previewId, children }: {
  bg?: SectionBg;
  anchor?: string;
  label?: string;
  /** ใช้ตอนดูตัวอย่างในหลังบ้าน คลิกแล้วเลือกส่วนนี้ในหน้าแก้ไขได้ */
  previewId?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={anchor} aria-label={label} data-sec-id={previewId} className={`relative overflow-hidden ${BG[bg]}`}>
      {children}
    </section>
  );
}

export function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`m-0 font-head text-h2 font-bold leading-[1.3] text-balance ${className}`}>{children}</h2>;
}

/** สีข้อความรอง เป็นสีเทาบนพื้นสว่าง และสีฟ้าอ่อนบนพื้นกรมท่า */
export const ink2 = (dark: boolean) => (dark ? "text-on-dark" : "text-ink2");

/** หน่วงเวลาให้แต่ละชิ้นค่อย ๆ ปรากฏทีละชิ้น ชิ้นละ 60 มิลลิวินาที สูงสุด 8 ชิ้น */
export const delay = (i: number) => ({ animationDelay: `${(Math.min(i, 8) * 0.06).toFixed(2)}s` });

export const btn = {
  accent:
    "inline-flex items-center gap-2.5 whitespace-nowrap rounded-ctl bg-accent-solid px-[22px] py-3.5 text-btn font-semibold text-white hover:text-white hover:brightness-110",
  primary:
    "inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-ctl bg-primary-solid px-5 py-3 text-btn font-semibold text-white hover:bg-primary-h hover:text-white",
  outlineLight:
    "inline-flex items-center whitespace-nowrap rounded-ctl border-[1.5px] border-white/50 px-[22px] py-[13px] text-btn font-semibold text-white hover:bg-white/10 hover:text-white",
  outline:
    "inline-flex items-center whitespace-nowrap rounded-ctl border-[1.5px] border-line px-5 py-3 font-semibold text-ink hover:text-primary",
};
