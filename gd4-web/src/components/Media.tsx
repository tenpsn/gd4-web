import Image from "next/image";
import type { Img } from "@/types/site";

/** แสดงรูปเต็มกรอบที่ครอบอยู่ ถ้ายังไม่มีรูปจริงจะแสดงกล่องลายทางแทน */
export function Media({ img, alt, sizes = "(min-width: 1024px) 50vw, 100vw", label = true, dark = false, priority = false }: {
  img: Img;
  alt: string;
  sizes?: string;
  label?: boolean;
  /** วางบนพื้นสีกรมท่า */
  dark?: boolean;
  priority?: boolean;
}) {
  if (img && img !== "placeholder") {
    return <Image src={img} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 grid place-items-center p-3 text-center font-mono text-[13px] font-medium ${
        dark ? "text-[#9fb4d8]" : "stripe text-ph-ink"
      }`}
      style={dark ? { background: "repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 10px,rgba(255,255,255,.02) 10px 20px)" } : undefined}
    >
      {label && img === "placeholder" ? alt : null}
    </div>
  );
}
