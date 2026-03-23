import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteManagedUser, getManagedUserById } from "@/lib/supabase/users";
import { canDeleteUser } from "@/lib/users/delete-permissions";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/users/[userId]">
) {
  const { userId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tu sesión no es válida." }, { status: 401 });
  }

  const { data: currentProfile, error: currentProfileError } = await getCurrentUserProfile(
    supabase,
    user.id
  );

  if (currentProfileError || !currentProfile?.is_approved) {
    return NextResponse.json(
      {
        error: "No tienes permisos para gestionar usuarios.",
        detail: currentProfileError?.message,
      },
      { status: 403 }
    );
  }

  const targetUser = await getManagedUserById(userId);

  if (!targetUser) {
    return NextResponse.json({ error: "El usuario ya no existe." }, { status: 404 });
  }

  const allowed = canDeleteUser(currentProfile.role, user.id, {
    id: targetUser.id,
    role: targetUser.role,
  });

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          targetUser.role === "owner"
            ? "Ningún Admin puede eliminar a un Owner."
            : "Un Admin solo puede eliminar a otro Admin.",
      },
      { status: 403 }
    );
  }

  try {
    await deleteManagedUser(targetUser.id);

    return NextResponse.json({
      ok: true,
      deletedCurrentUser: targetUser.id === user.id,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";

    return NextResponse.json(
      {
        error: "Supabase no pudo eliminar al usuario.",
        detail,
      },
      { status: 500 }
    );
  }
}