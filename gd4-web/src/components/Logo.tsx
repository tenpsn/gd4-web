/** โลโก้แบบตัวอักษรจากต้นแบบ เปลี่ยนเป็นไฟล์โลโก้จริงเมื่อมีแล้ว */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <span
      className="relative grid flex-none place-items-center rounded-ctl bg-primary-solid font-bold text-white"
      style={{ width: size, height: size, fontSize: size >= 44 ? 14 : 13.5 }}
    >
      GD4
      {size >= 44 && (
        <span className="absolute -right-[3px] -top-[3px] size-2.5 rounded-full border-2 border-bg bg-accent-solid" />
      )}
    </span>
  );
}
