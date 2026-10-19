import { NextResponse, type NextRequest } from "next/server";
import { publicRoute, pathFor } from "@/i18n/routing";

export function proxy(request: NextRequest) {
  let pathname: string;
  try {
    pathname = decodeURIComponent(request.nextUrl.pathname);
  } catch {
    pathname = "/not-found";
  }
  const { locale, route } = publicRoute(pathname);
  const target = request.nextUrl.clone();
  if (pathname === "/tr" || pathname.startsWith("/tr/")) {
    target.pathname = route
      ? pathFor("tr", route.page, route.slug)
      : pathname.slice(3) || "/";
    return NextResponse.redirect(target, 308);
  }
  if (!route) {
    target.pathname = `/${locale}/not-found`;
    return NextResponse.rewrite(target, { status: 404 });
  }
  if (locale === "en") return NextResponse.next();
  target.pathname = `/tr${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next(?:/|$)|icon\\.svg$|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|opengraph-image(?:-en)?(?:/|$)|.*\\.[^/]+$).*)",
  ],
};
