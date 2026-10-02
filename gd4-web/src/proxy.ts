import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/session";

/**
 * หน้าแอดมินตรวจการเข้าระบบเบื้องต้นจากคุกกี้ ส่วนการตรวจสิทธิ์จริงทำที่แต่ละหน้า
 * หน้าเว็บภาษาไทยไม่มีคำนำหน้าในลิงก์ ภาษาอังกฤษขึ้นต้นด้วย en และลิงก์ที่ขึ้นต้นด้วย th จะถูกส่งไปลิงก์แบบไม่มีคำนำหน้า
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // หน้าดูตัวอย่างงานร่าง เปิดได้เฉพาะแอดมินที่เข้าระบบแล้ว และไม่ต้องจัดการภาษา
  if (pathname.startsWith("/preview/")) {
    if (readSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
    return new NextResponse("Not found", { status: 404 });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const signedIn = !!readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    // หน้าแอดมินที่เปิดได้โดยไม่ต้องเข้าระบบ คือหน้าเข้าสู่ระบบและหน้าลิงก์เชิญ
    const isPublic = pathname === "/admin/login" || pathname.startsWith("/admin/invite/");
    if (!signedIn && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    // ผู้ที่เข้าระบบแล้วแต่อยู่หน้าเข้าสู่ระบบ ให้หน้านั้นพาไปต่อเองหลังตรวจครบ
    // ถ้าทำตรงนี้ ผู้ใช้ที่ถูกระงับแต่คุกกี้ยังใช้ได้อาจวนไม่จบ
    return NextResponse.next();
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  if (pathname === "/th" || pathname.startsWith("/th/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/th${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // ข้ามไฟล์ภายในของ Next.js ลิงก์ api และไฟล์ที่มีนามสกุล เช่น รูปภาพ
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
