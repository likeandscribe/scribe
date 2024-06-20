import { middleware as authMiddleware } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default authMiddleware((req) => {
  const url = new URL(req.url);
  if (req.auth) {
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL("/authed-homepage", url));
    }
  } else if (url.pathname === "/authed-homepage") {
    return NextResponse.redirect(new URL("/", url));
  }
  return NextResponse.next();
}) as any;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
