import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthMessage } from "@/components/auth/auth-form-primitives";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  getCurrentUserProfile,
  isProfilesTableMissing,
} from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "En espera",
};

type WaitPageProps = {
  searchParams: Promise<{
    verified?: string;
  }>;
};

export default async function WaitPage({ searchParams }: WaitPageProps) {
  const { verified } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await getCurrentUserProfile(supabase, user.id);
  const needsSetup = isProfilesTableMissing(error);
  const isApproved = Boolean(profile?.is_approved);

  const title = needsSetup
    ? "Falta terminar la configuración"
    : isApproved
      ? "Tu cuenta ya está aprobada"
      : "Tu cuenta está en revisión";

  const description = needsSetup
    ? "El acceso ya funciona, pero todavía falta ejecutar el SQL de perfiles en Supabase para completar el flujo."
    : isApproved
      ? "Tu acceso ya quedó habilitado. Esta pantalla será temporal mientras conectamos el panel principal."
      : "Tu correo ya fue verificado. Ahora solo falta la aprobación manual del owner para entrar al sistema.";

  const statusLabel = needsSetup
    ? "Configuración pendiente"
    : isApproved
      ? "Aprobada"
      : "En espera";

  const statusToneClasses = needsSetup
    ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
    : isApproved
      ? "bg-[rgba(54,74,111,0.12)] text-[color:var(--brand-mid)]"
      : "bg-[color:var(--accent-soft)] text-[color:var(--accent)]";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(246,205,221,0.45)] blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[rgba(54,74,111,0.08)] blur-3xl" />
      <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-[rgba(208,211,216,0.45)] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-white/70 bg-white/92 p-5 shadow-[0_26px_70px_rgba(22,36,61,0.10)] backdrop-blur sm:rounded-[2.25rem] sm:p-8 lg:p-10">
          <div className="space-y-6 sm:space-y-8">
            <header className="space-y-5 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--line)] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(22,36,61,0.06)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand-dark)] font-logo text-sm tracking-[0.16em] text-white">
                    Q
                  </div>
                  <div className="text-left leading-none">
                    <p className="font-logo text-[1.05rem] tracking-[0.26em] text-[color:var(--brand-dark)]">
                      QUIOSCO
                    </p>
                    <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                      Control escolar
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${statusToneClasses}`}
                  >
                    {statusLabel}
                  </span>
                  {verified === "1" ? (
                    <span className="inline-flex rounded-full bg-[rgba(54,74,111,0.1)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
                      Correo verificado
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h1 className="mx-auto max-w-3xl font-heading text-[2.45rem] font-bold leading-[0.96] tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[3.3rem] lg:text-[4.2rem]">
                  {title}
                </h1>
                <p className="mx-auto max-w-2xl text-[0.98rem] leading-7 text-[color:var(--brand-mid)] sm:text-[1.06rem] sm:leading-8">
                  {description}
                </p>
              </div>
            </header>

            <div className="space-y-3">
              {verified === "1" ? (
                <AuthMessage tone="success">
                  Tu correo fue verificado correctamente.
                </AuthMessage>
              ) : null}

              {needsSetup ? (
                <AuthMessage tone="danger">
                  Ejecuta el SQL de <span className="font-semibold">supabase/schema.sql</span> en tu proyecto de Supabase para crear la tabla de perfiles y las reglas de acceso.
                </AuthMessage>
              ) : null}
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-[1.5fr_1fr]">
              <article className="rounded-[1.4rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                  Correo
                </p>
                <p className="mt-2 break-words text-[0.98rem] leading-7 text-[color:var(--brand-dark)] sm:text-[1.02rem]">
                  {user.email}
                </p>
              </article>

              <article className="rounded-[1.4rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                  Estado
                </p>
                <p className="mt-2 text-[0.98rem] leading-7 text-[color:var(--brand-dark)] sm:text-[1.02rem]">
                  {statusLabel}
                </p>
              </article>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,205,221,0.12))] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                    Siguiente paso
                  </p>
                  <p className="text-sm leading-7 text-[color:var(--brand-dark)] sm:text-[0.98rem]">
                    {isApproved
                      ? "En el siguiente paso conectaremos esta cuenta con el panel principal del quiosco."
                      : "Cuando el owner apruebe tu cuenta, podrás entrar al sistema sin repetir el registro."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 self-stretch sm:items-end">
                  <div className="flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)] shadow-[0_8px_20px_rgba(22,36,61,0.04)] sm:self-auto">
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                    {isApproved ? "Lista" : "Pendiente"}
                  </div>
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
