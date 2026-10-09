import type { Img } from "@/types/site";

export type BrandInfo = { name: string; logo: Img; logoDark: Img };

const real = (i: Img) => (i && i !== "placeholder" ? i : null);

/**
 * โลโก้ของเว็บในหลังบ้าน ใช้โลโก้จากหน้าตั้งค่า ถ้ายังไม่ได้อัปโหลดโลโก้จะไม่แสดงอะไร
 * onDark ใช้บนพื้นสีเข้ม จะเลือกโลโก้สำหรับพื้นเข้มก่อน ถ้ามีแค่โลโก้ปกติจะวางบนพื้นขาว
 * บนพื้นสว่างจะสลับเป็นโลโก้สำหรับพื้นเข้มเองเมื่อเปิดโหมดมืด
 */
export function BrandMark({ brand, onDark = false, size = "size-11" }: { brand: BrandInfo; onDark?: boolean; size?: string }) {
  const logo = real(brand.logo);
  const dark = real(brand.logoDark);
  const box = `relative grid ${size} flex-none place-items-center rounded-lg`;
  const img = "size-full object-contain";

  if (onDark && (dark || logo)) {
    return (
      <span className={`${box} ${dark ? "" : "bg-white p-1"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- โลโก้ที่อัปโหลดเอง ต้องคงสัดส่วนเดิม */}
        <img src={(dark ?? logo)!} alt="" className={img} />
      </span>
    );
  }
  if (!onDark && logo) {
    return (
      <span className={box}>
        {/* eslint-disable-next-line @next/next/no-img-element -- โลโก้ที่อัปโหลดเอง ต้องคงสัดส่วนเดิม */}
        <img src={logo} alt="" className={`${img} ${dark ? "dark:hidden" : ""}`} />
        {dark && (
          // eslint-disable-next-line @next/next/no-img-element -- โลโก้สำหรับโหมดมืด
          <img src={dark} alt="" className={`${img} hidden dark:block`} />
        )}
      </span>
    );
  }
  // ยังไม่ได้อัปโหลดโลโก้ ไม่ต้องแสดงอะไร ให้มีแค่ชื่อเว็บ
  return null;
}
