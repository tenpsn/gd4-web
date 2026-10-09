/** แปลงเป็นข้อความโดยเรียงคีย์ก่อน เพราะฐานข้อมูลเก็บ jsonb แล้วสลับลำดับคีย์ให้เอง */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? "null" : stable(x))).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

/** เทียบข้อมูลสองชุดว่าเหมือนกันไหม โดยไม่สนลำดับคีย์ */
export const same = (a: unknown, b: unknown) => stable(a) === stable(b);
