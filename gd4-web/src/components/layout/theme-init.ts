export const THEME_KEY = "theme";
/** หลังบ้านจำโหมดสว่างหรือมืดแยกจากหน้าเว็บไซต์ */
export const ADMIN_THEME_KEY = "admin-theme";

/** ทำงานก่อนหน้าเว็บแสดงผล ใช้ธีมที่เคยเลือกไว้ ถ้าไม่มีจะใช้ตามเครื่อง
 * ต้องเขียนให้สั้นและไม่พึ่งอะไรเพิ่ม เพราะถูกใส่ไว้ในทุกหน้า */
export const themeInitScript = (key: string) =>
  `(function(){try{var t=localStorage.getItem("${key}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

export const THEME_INIT = themeInitScript(THEME_KEY);

/** เปิดภาพลอยขึ้นตอนเลื่อนถึงก่อนหน้าเว็บแสดงผล เพื่อไม่ให้เนื้อหากะพริบ ถ้าเครื่องปิดภาพเคลื่อนไหวจะไม่เปิด */
export const REVEAL_INIT = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.reveal=""}catch(e){}`;
