import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  applyCookies: (response: NextResponse) => NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return applyCookies(NextResponse.redirect(url));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { supabase, applyCookies } = createSupabaseRequestClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname.startsWith("/wait")) {
    return redirectWithCookies(request, "/", applyCookies);
  }

  if (user && (pathname === "/" || pathname === "/signup")) {
    return redirectWithCookies(request, "/wait", applyCookies);
  }

  return applyCookies(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
