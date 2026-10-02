/**
 * กำหนดจำนวนคอลัมน์ ถ้ามีไม่เกิน 4 รายการให้หนึ่งคอลัมน์ต่อรายการ ถ้ามากกว่าใช้ 3 เมื่อหาร 3 ลงตัว ไม่งั้นใช้ 4
 * แท็บเล็ตปกติไม่เกิน 2 มือถือปกติ 1 และเขียนชื่อคลาสเต็มไว้เพื่อให้ Tailwind หาเจอ
 */
const M = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"];
const T = ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"];
const D = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];

export function gridCols(count: number, o: { cols?: number; max?: number; t?: number; m?: number } = {}): string {
  let c = o.cols ?? (count <= 4 ? count : count % 3 === 0 ? 3 : 4);
  c = Math.max(1, Math.min(c, o.max ?? 4));
  const t = Math.max(1, Math.min(c, o.t ?? 2));
  const m = Math.max(1, Math.min(c, o.m ?? 1));
  return `${M[m]} ${T[t]} ${D[c]}`;
}

/** ถ้ามีไม่เกิน 2 รายการ ให้แคบลงบนคอมพิวเตอร์ */
export const gridMax = (count: number) => (count <= 2 ? "lg:max-w-[900px]" : "");
