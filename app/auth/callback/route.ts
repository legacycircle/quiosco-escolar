import { NextResponse, type NextRequest } from "next/server";
import { syncProfileFromUser } from "@/lib/supabase/profiles";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

function buildLoginRedirect(request: NextRequest, error: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("error", error);
  return url;
}

export async function GET(request: NextRequest) {
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(buildLoginRedirect(request, errorDescription));
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      buildLoginRedirect(
        request,
        "No pudimos validar el enlace de verificación."
      )
    );
  }

  const { supabase, applyCookies } = createSupabaseRequestClient(request);
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    return applyCookies(
      NextResponse.redirect(
        buildLoginRedirect(
          request,
          "El enlace ya venció o no es válido. Solicita uno nuevo."
        )
      )
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return applyCookies(
      NextResponse.redirect(
        buildLoginRedirect(
          request,
          "Tu correo fue verificado, pero no pudimos abrir la sesión."
        )
      )
    );
  }

  await syncProfileFromUser(user);

  const url = request.nextUrl.clone();
  url.pathname = "/wait";
  url.search = "";
  url.searchParams.set("verified", "1");

  return applyCookies(NextResponse.redirect(url));
}
