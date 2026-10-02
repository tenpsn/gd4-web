import type { IconName } from "@/types/site";

/** ชุดไอคอนเส้นขนาด 24 พิกเซล แต่ละเส้นคั่นด้วยขีดตั้ง */
const IC: Record<IconName, string> = {
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z|M8.2 13.9L7 22l5-3 5 3-1.2-8.1",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M22 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 6v6l4 2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  box: "M21 8l-9-5-9 5 9 5 9-5z|M3 8v8l9 5 9-5V8|M12 13v8",
  chart: "M3 3v18h18|M7 15l4-4 3 3 5-6",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1",
  check: "M20 6L9 17l-5-5",
  chevD: "M6 9l6 6 6-6",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  menu: "M3 6h18|M3 12h18|M3 18h18",
  x: "M18 6L6 18|M6 6l12 12",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z|M12 1v2|M12 21v2|M4.2 4.2l1.4 1.4|M18.4 18.4l1.4 1.4|M1 12h2|M21 12h2|M4.2 19.8l1.4-1.4|M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  play: "M6 4l14 8-14 8z",
  pin: "M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M22 6l-10 7L2 6",
  arrowR: "M5 12h14|M12 5l7 7-7 7",
  image: "M3 3h18v18H3z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M21 15l-5-5L5 21",
  alert: "M12 8v5|M12 16.5h.01|M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  plus: "M12 5v14|M5 12h14",
  minus: "M5 12h14",
  home: "M3 11l9-8 9 8|M5 10v10h14V10",
  noimg: "M3 3l18 18|M21 15V3H9|M3 7v14h14|M8.5 10.5l-5.5 6.5",
};

export function Icon({ name, size = 20, stroke = 1.8, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`block flex-none ${className ?? ""}`}
    >
      {IC[name].split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
