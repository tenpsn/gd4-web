import { siFacebook, siInstagram, siLine, siTiktok, siX, siYoutube } from "simple-icons";
import type { Img, SocialPlatform } from "@/types/site";

/** ชื่อ สีพื้น และโลโก้ของแต่ละแพลตฟอร์ม โลโก้มาจากชุด simple-icons ส่วน LinkedIn ไม่มีในชุดนี้จึงใช้ตัวอักษร in แทน */
export const SOCIALS: Record<SocialPlatform, { name: string; bg: string; path?: string }> = {
  facebook: { name: "Facebook", bg: `#${siFacebook.hex}`, path: siFacebook.path },
  line: { name: "LINE", bg: "#06c755", path: siLine.path },
  youtube: { name: "YouTube", bg: `#${siYoutube.hex}`, path: siYoutube.path },
  instagram: { name: "Instagram", bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)", path: siInstagram.path },
  linkedin: { name: "LinkedIn", bg: "#0a66c2" },
  tiktok: { name: "TikTok", bg: "#111111", path: siTiktok.path },
  x: { name: "X", bg: "#111111", path: siX.path },
  // ช่องทางอื่นที่ตั้งชื่อและโลโก้เอง ถ้ายังไม่มีโลโก้จะแสดงรูปโซ่บนพื้นเทา
  custom: { name: "Link", bg: "#6b778a", path: "M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5|M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" },
};

type Social = { platform: SocialPlatform; name?: string; icon?: Img };

/** ชื่อที่ใช้แสดงและอ่านออกเสียง ช่องทางอื่นใช้ชื่อที่แอดมินตั้ง */
export const socialName = (s: Social) => (s.platform === "custom" ? s.name || SOCIALS.custom.name : SOCIALS[s.platform].name);

/** สีพื้นของวงกลม ช่องทางอื่นที่มีโลโก้แล้วใช้พื้นขาวให้โลโก้เห็นชัด */
export const socialBg = (s: Social) => (s.platform === "custom" && s.icon ? "#ffffff" : SOCIALS[s.platform].bg);

/** โลโก้ของแพลตฟอร์ม เป็นสีขาวบนวงกลมสีของแพลตฟอร์ม ช่องทางอื่นแสดงโลโก้ที่อัปโหลดไว้ */
export function SocialGlyph({ social, size = 18 }: { social: Social; size?: number }) {
  const s = SOCIALS[social.platform];
  if (social.platform === "custom") {
    if (social.icon && social.icon !== "placeholder") {
      // eslint-disable-next-line @next/next/no-img-element -- โลโก้ขนาดเล็กที่อัปโหลดเอง ไม่ต้องย่อรูปผ่านระบบ
      return <img src={social.icon} alt="" className="size-full rounded-full object-cover" />;
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {s.path!.split("|").map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  if (!s.path) {
    return (
      <span className="font-bold leading-none" style={{ fontSize: size * 0.85 }} aria-hidden="true">
        in
      </span>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={s.path} />
    </svg>
  );
}
