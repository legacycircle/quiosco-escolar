import type { Metadata } from "next";
import { UsersTable } from "@/components/users/users-table";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";
import { getAllManagedUsers } from "@/lib/supabase/users";

export const metadata: Metadata = {
  title: "Usuarios",
};

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#eadcd2] bg-white px-5 py-3.5 shadow-[0_16px_36px_rgba(22,36,61,0.06)]">
      <p className="text-[0.96rem] text-[color:var(--brand-mid)]">{label}</p>
      <p className="mt-1.5 font-heading text-[2.05rem] font-bold leading-none tracking-[-0.05em] text-[color:var(--brand-dark)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm text-[color:var(--brand-mid)]">{detail}</p>
      ) : (
        <div className="mt-2 h-[1rem]" />
      )}
    </article>
  );
}

export default async function UsersPage() {
  const [{ user, profile }, users] = await Promise.all([
    getApprovedUserContext(),
    getAllManagedUsers(),
  ]);

  const activeUsers = users.filter((item) => item.is_approved).length;
  const pendingUsers = users.filter((item) => !item.is_approved).length;
  const owners = users.filter((item) => item.role === "owner").length;
  const admins = users.filter((item) => item.role === "admin").length;
  const currentUserRole = profile?.role === "owner" ? "owner" : "admin";

  const tableItems = users.map((item) => ({
    id: item.id,
    fullName: item.full_name,
    email: item.email,
    role: item.role,
    isApproved: item.is_approved,
  }));

  return (
    <>
      <section className="space-y-4 lg:space-y-5">
        <div>
          <h1 className="font-heading text-[2.1rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[2.7rem] lg:text-[2.95rem]">
            Usuarios
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm text-[color:var(--brand-mid)] sm:text-base">
            Lista visible de usuarios del sistema con rol, correo y control de borrado según permisos.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Usuarios activos"
            value={String(activeUsers)}
            detail={activeUsers === 1 ? "Solo tú estás activo" : "Cuentas aprobadas con acceso al panel"}
          />
          <MetricCard
            label="Admins"
            value={String(admins)}
            detail="Los Admin pueden eliminar a otro Admin, nunca a un Owner"
          />
          <MetricCard
            label="Owners"
            value={String(owners)}
            detail="El Owner puede eliminar a cualquier usuario"
          />
          <MetricCard
            label="Pendientes"
            value={String(pendingUsers)}
            detail={pendingUsers === 0 ? "No hay usuarios esperando aprobación" : "Usuarios sin aprobación todavía"}
          />
        </section>
      </section>

      <UsersTable
        items={tableItems}
        currentUserId={user.id}
        currentUserRole={currentUserRole}
      />
    </>
  );
}