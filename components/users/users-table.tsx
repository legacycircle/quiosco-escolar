"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { canDeleteUser, type UserRole } from "@/lib/users/delete-permissions";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

type UserRow = {
  id: string;
  fullName: string | null;
  email: string;
  role: UserRole;
  isApproved: boolean;
};

type UsersTableProps = {
  items: UserRow[];
  currentUserId: string;
  currentUserRole: UserRole;
};

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return { tone, title, text, detail } satisfies Feedback;
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4 text-sm leading-6",
        feedback.tone === "success"
          ? "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/30 text-[color:var(--brand-dark)]"
          : "border-[color:var(--accent)]/22 bg-[color:var(--accent-soft)]/42 text-[color:var(--brand-dark)]",
      ].join(" ")}
    >
      <p className="font-semibold text-[color:var(--brand-dark)]">{feedback.title}</p>
      <p className="mt-1">{feedback.text}</p>
      {feedback.detail ? (
        <p className="mt-2 break-words rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-[color:var(--brand-mid)]">
          {feedback.detail}
        </p>
      ) : null}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.8c0-.44.36-.8.8-.8h6.4c.44 0 .8.36.8.8V6" />
      <path d="M6.8 6l.73 11.03A2 2 0 0 0 9.52 19h4.96a2 2 0 0 0 1.99-1.97L17.2 6" />
      <path d="M10 10.25v5.5" />
      <path d="M14 10.25v5.5" />
    </svg>
  );
}

function formatRole(role: UserRole) {
  return role === "owner" ? "Owner" : "Admin";
}

function getDisplayName(user: UserRow) {
  if (user.fullName?.trim()) {
    return user.fullName.trim();
  }

  return user.email.split("@")[0] ?? "Usuario";
}

function getDeleteHint(user: UserRow, currentUserId: string, currentUserRole: UserRole) {
  if (currentUserRole === "owner") {
    return user.id === currentUserId
      ? "Como Owner también puedes eliminar tu propia cuenta."
      : "El Owner puede eliminar a cualquier usuario.";
  }

  if (user.role === "owner") {
    return "Ningún Admin puede eliminar a un Owner.";
  }

  if (user.id === currentUserId) {
    return "Un Admin solo puede eliminar a otro Admin.";
  }

  return "Eliminar usuario";
}

export function UsersTable({ items, currentUserId, currentUserRole }: UsersTableProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (user: UserRow) => {
    const allowed = canDeleteUser(currentUserRole, currentUserId, {
      id: user.id,
      role: user.role,
    });

    if (!allowed) {
      setFeedback(
        buildFeedback(
          "Acción bloqueada",
          user.role === "owner"
            ? "No puedes eliminar a un usuario con rol Owner."
            : "Un Admin solo puede eliminar a otro Admin."
        )
      );
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const confirmed = window.confirm(
            `¿Deseas borrar a ${getDisplayName(user)}? Esta acción eliminará su acceso por completo.`
          );

          if (!confirmed) {
            return;
          }

          const response = await fetch(`/api/users/${user.id}`, {
            method: "DELETE",
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: string; detail?: string; deletedCurrentUser?: boolean }
            | null;

          if (!response.ok) {
            setFeedback(
              buildFeedback(
                "No se pudo borrar",
                payload?.error ?? "No se pudo eliminar al usuario.",
                payload?.detail
              )
            );
            return;
          }

          setFeedback(buildFeedback("Usuario eliminado", "El usuario fue eliminado correctamente.", undefined, "success"));

          if (payload?.deletedCurrentUser) {
            window.location.href = "/";
            return;
          }

          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("No se pudo borrar", "La solicitud falló al intentar borrar al usuario.", detail));
        }
      })();
    });
  };

  return (
    <section className="rounded-[2rem] border border-[#eadcd2] bg-white p-4 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:p-5 lg:rounded-[1.8rem]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-[1.9rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
          Usuarios
        </h2>
        <p className="text-sm text-[color:var(--brand-mid)]">
          {items.length === 0 ? "Sin usuarios registrados" : `${items.length} usuarios visibles`}
        </p>
      </div>

      {feedback ? (
        <div className="mt-4">
          <FeedbackBanner feedback={feedback} />
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#eadcd2] bg-[#fffdfa]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-[#f6ede7] text-left text-[0.88rem] font-semibold text-[color:var(--brand-dark)]">
                <th className="px-4 py-1.5">Nombre</th>
                <th className="px-4 py-1.5">Correo</th>
                <th className="px-4 py-1.5">Rol</th>
                <th className="px-4 py-1.5 text-right">Borrar</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-mid)]">
                  <td className="px-4 py-4">Sin usuarios</td>
                  <td className="px-4 py-4">&nbsp;</td>
                  <td className="px-4 py-4">&nbsp;</td>
                  <td className="px-4 py-4">&nbsp;</td>
                </tr>
              ) : (
                items.map((user) => {
                  const canDelete = canDeleteUser(currentUserRole, currentUserId, {
                    id: user.id,
                    role: user.role,
                  });
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-dark)]"
                    >
                      <td className="px-4 py-2.5 font-semibold">
                        <div>
                          <p>{getDisplayName(user)}</p>
                          <p className="mt-1 text-xs font-normal text-[color:var(--brand-mid)]">
                            {isCurrentUser ? "Tu cuenta" : user.isApproved ? "Usuario activo" : "Pendiente de aprobación"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[color:var(--brand-mid)]">{user.email}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={[
                              "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                              user.role === "owner"
                                ? "bg-[rgba(22,36,61,0.08)] text-[color:var(--brand-dark)]"
                                : "bg-[rgba(209,7,84,0.1)] text-[color:var(--accent)]",
                            ].join(" ")}
                          >
                            {formatRole(user.role)}
                          </span>
                          <span className="text-xs text-[color:var(--brand-mid)]">
                            {user.isApproved ? "Activo" : "Pendiente"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          aria-label={`Borrar ${getDisplayName(user)}`}
                          onClick={() => handleDelete(user)}
                          disabled={isPending || !canDelete}
                          title={getDeleteHint(user, currentUserId, currentUserRole)}
                          className={[
                            "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white transition disabled:cursor-not-allowed disabled:opacity-65",
                            canDelete
                              ? "border-[#eadcd2] text-[color:var(--brand-dark)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                              : "border-[#efe3da] text-[color:var(--brand-mid)] opacity-55",
                          ].join(" ")}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
