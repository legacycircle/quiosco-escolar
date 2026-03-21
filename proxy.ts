import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

const protectedPrefixes = [
  "/wait",
  "/dashboard",
  "/gastos",
  "/ingresos",
  "/productos",
  "/proveedores",
  "/cuentas",
  "/usuarios",
  "/mi-cuenta",
];

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

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isApprovedOnlyRoute = protectedPrefixes.some(
    (prefix) => prefix !== "/wait" && pathname.startsWith(prefix)
  );

  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, "/", applyCookies);
  }

  if (!user) {
    return applyCookies(NextResponse.next({ request }));
  }

  const { data: profile } = await getCurrentUserProfile(supabase, user.id);
  const isApproved = Boolean(profile?.is_approved);

  if (pathname === "/" || pathname === "/signup") {
    return redirectWithCookies(request, isApproved ? "/dashboard" : "/wait", applyCookies);
  }

  if (isApproved && pathname.startsWith("/wait")) {
    return redirectWithCookies(request, "/dashboard", applyCookies);
  }

  if (!isApproved && isApprovedOnlyRoute) {
    return redirectWithCookies(request, "/wait", applyCookies);
  }

  return applyCookies(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
