/** ชุดไอคอนเส้นของหน้าแอดมิน ขนาด 24 พิกเซล แต่ละเส้นคั่นด้วยขีดตั้ง */
const IC = {
  dash: "M3 3h7v9H3z|M14 3h7v5h-7z|M14 12h7v9h-7z|M3 16h7v5H3z",
  box: "M21 8l-9-5-9 5 9 5 9-5z|M3 8v8l9 5 9-5V8|M12 13v8",
  page: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z|M14 3v5h5|M9 13h6|M9 17h6",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2|M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M22 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8",
  gear: "M4 21v-7|M4 10V3|M12 21v-9|M12 8V3|M20 21v-5|M20 12V3|M1 14h6|M9 8h6|M17 16h6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z|M12 1v2|M12 21v2|M4.2 4.2l1.4 1.4|M18.4 18.4l1.4 1.4|M1 12h2|M21 12h2|M4.2 19.8l1.4-1.4|M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  menu: "M3 6h18|M3 12h18|M3 18h18",
  x: "M18 6L6 18|M6 6l12 12",
  plus: "M12 5v14|M5 12h14",
  edit: "M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18|M8 6V4h8v2|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6|M10 11v6|M14 11v6",
  grid: "M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z",
  list: "M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  chevD: "M6 9l6 6 6-6",
  chevU: "M18 15l-6-6-6 6",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.1-5.9|M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2|M1 1l22 22",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  drag: "M9 5h.01|M9 12h.01|M9 19h.01|M15 5h.01|M15 12h.01|M15 19h.01",
  check: "M20 6L9 17l-5-5",
  alert: "M12 8v5|M12 16.5h.01|M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M9 15h6",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8|M3 3v5h5|M12 7v5l4 2",
  image: "M3 3h18v18H3z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M21 15l-5-5L5 21",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M22 6l-10 7L2 6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1",
  reply: "M9 17l-5-5 5-5|M20 18v-2a4 4 0 0 0-4-4H4",
  arrowL: "M19 12H5|M12 19l-7-7 7-7",
  lock: "M5 11h14v10H5z|M8 11V7a4 4 0 0 1 8 0v4",
  monitor: "M2 3h20v14H2z|M8 21h8|M12 17v4",
  mobile: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z|M11 18h2",
  tablet: "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z|M11 18h2",
  side: "M3 3h18v18H3z|M9 3v18",
  text: "M4 7V4h16v3|M9 20h6|M12 4v16",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M2 12h20|M12 2a15 15 0 0 1 0 20|M12 2a15 15 0 0 0 0 20",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 6v6l4 2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  copy: "M9 9h11v11H9z|M5 15H4V4h11v1",
  undo: "M9 14L4 9l5-5|M4 9h11a5 5 0 0 1 0 10h-3",
  chart: "M3 3v18h18|M7 15l4-4 3 3 5-6",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z|M8.2 13.9L7 22l5-3 5 3-1.2-8.1",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z",
  pin: "M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  home: "M3 11l9-8 9 8|M5 10v10h14V10",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6|M15 3h6v6|M10 14L21 3",
} as const;

export type AIconName = keyof typeof IC;

export function AIcon({ name, size = 18, stroke = 1.8 }: { name: AIconName; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "drag" ? 3 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="block flex-none"
    >
      {IC[name].split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
