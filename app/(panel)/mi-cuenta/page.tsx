import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export default async function MyAccountPage() {
  const { user, profile, userLabel } = await getApprovedUserContext();
  const roleLabel = profile?.role === "owner" ? "Owner" : "Admin";
  const initial = userLabel.charAt(0).toUpperCase() || "Q";

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-[1.9rem] border border-[#eadcd2] bg-white p-6 shadow-[0_18px_40px_rgba(22,36,61,0.06)]">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--brand-dark)] font-heading text-2xl font-bold text-white shadow-[0_18px_38px_rgba(22,36,61,0.18)]">
            {initial}
          </div>
          <h1 className="mt-4 font-heading text-[2.1rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
            {userLabel}
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
            {roleLabel}
          </p>
        </div>
      </article>

      <article className="rounded-[1.9rem] border border-[#eadcd2] bg-white p-6 shadow-[0_18px_40px_rgba(22,36,61,0.06)]">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
          Mi cuenta
        </p>
        <h2 className="mt-3 font-heading text-[2.1rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
          Datos visibles de la cuenta
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.3rem] border border-[#efe3da] bg-[#fcfaf8] p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Nombre
            </p>
            <p className="mt-2 text-[1rem] text-[color:var(--brand-dark)]">{userLabel}</p>
          </div>
          <div className="rounded-[1.3rem] border border-[#efe3da] bg-[#fcfaf8] p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Correo
            </p>
            <p className="mt-2 break-words text-[1rem] text-[color:var(--brand-dark)]">{user.email}</p>
          </div>
          <div className="rounded-[1.3rem] border border-[#efe3da] bg-[#fcfaf8] p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Rol
            </p>
            <p className="mt-2 text-[1rem] text-[color:var(--brand-dark)]">{roleLabel}</p>
          </div>
          <div className="rounded-[1.3rem] border border-[#efe3da] bg-[#fcfaf8] p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Estado
            </p>
            <p className="mt-2 text-[1rem] text-[color:var(--brand-dark)]">Aprobada</p>
          </div>
        </div>

        <div className="mt-6 border-t border-[#efe3da] pt-6">
          <SignOutButton fullWidth />
        </div>
      </article>
    </section>
  );
}
