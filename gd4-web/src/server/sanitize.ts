/**
 * ทำความสะอาดข้อความจัดรูปแบบจากหลังบ้าน เก็บไว้เฉพาะแท็กพื้นฐานกับลิงก์ที่ปลอดภัย
 * แท็กอื่นถูกตัดทิ้งแต่ข้อความยังอยู่ และลบคุณสมบัติอื่นของแท็กออกทั้งหมด
 */
const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"]);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi;

function safeHref(raw: string): string | null {
  const v = raw.trim().replace(/[\u0000-\u001f\s]+/g, "");
  if (/^(https?:|mailto:|tel:)/i.test(v) || (v.startsWith("/") && !v.startsWith("//"))) return v;
  return null;
}

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sanitizeHtml(input: string, maxLen = 20000): string {
  const html = input.slice(0, maxLen).replace(/<!--[\s\S]*?-->/g, "").replace(DROP_WITH_CONTENT, "");
  return html
    .replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g, (_m, close: string, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED.has(name)) return "";
      if (close) return name === "br" ? "" : `</${name}>`;
      if (name === "a") {
        const m = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const href = m ? safeHref(m[2] ?? m[3] ?? m[4] ?? "") : null;
        return href ? `<a href="${escAttr(href)}" rel="noopener noreferrer">` : "<a>";
      }
      return name === "br" ? "<br>" : `<${name}>`;
    })
    // เครื่องหมายเปิดแท็กที่หลงเหลือ ต้องไม่กลายเป็นแท็กในภายหลัง
    .replace(/<(?!\/?(p|br|strong|b|em|i|ul|ol|li|a)\b)/gi, "&lt;");
}
