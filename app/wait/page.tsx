import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthMessage } from "@/components/auth/auth-form-primitives";
import { AuthShell } from "@/components/auth/auth-shell";
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

function buildSteps(isApproved: boolean) {
  return [
    {
      title: "Cuenta creada",
      description: "Tu registro quedó creado con acceso por correo y contraseña.",
      status: "Completado",
    },
    {
      title: "Correo verificado",
      description:
        "La verificación del email quedó conectada con Supabase y el callback del proyecto.",
      status: "Completado",
    },
    {
      title: "Aprobación manual del owner",
      description: isApproved
        ? "Tu usuario ya fue aprobado. Esta pantalla quedará temporal hasta conectar el panel principal."
        : "Tu acceso seguirá en espera hasta que el owner apruebe manualmente la cuenta en Supabase.",
      status: isApproved ? "Aprobado" : "Pendiente",
    },
  ];
}

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
  const roleLabel = profile?.role === "owner" ? "owner" : "admin";
  const title = needsSetup
    ? "Falta terminar la configuración en Supabase."
    : isApproved
      ? "Tu cuenta ya está aprobada."
      : "Tu cuenta está en revisión manual.";
  const description = needsSetup
    ? "El login ya funciona, pero todavía falta ejecutar el SQL de perfiles y aprobación manual para completar el flujo."
    : isApproved
      ? `Tu acceso como ${roleLabel} ya quedó habilitado. Mientras construimos el panel principal, esta pantalla sirve como punto de entrada temporal.`
      : "Tu correo ya fue verificado y ahora solo falta la aprobación manual del owner para abrir el resto del sistema.";
  const steps = buildSteps(isApproved);

  return (
    <AuthShell
      badge="Sala de espera"
      title={title}
      description={description}
      asideLabel="Lo que viene"
      asideTitle="El acceso del quiosco ya quedó conectado al flujo real."
      asideDescription="Ahora el registro crea usuarios con email y contraseña, la verificación vuelve por /auth/callback y la aprobación manual queda lista para manejarse desde Supabase."
      metrics={[
        { value: "2", label: "roles del sistema" },
        { value: "Manual", label: "aprobación owner" },
        { value: "100%", label: "email auth" },
      ]}
      highlights={[
        "Owner único definido una sola vez desde Supabase.",
        "Admins creados por signup con aprobación manual.",
        "Callback de verificación conectado a Supabase.",
        "Después: dashboard, productos, ventas, gastos y reportes.",
      ]}
    >
      <div className="space-y-6">
        {verified === "1" ? (
          <AuthMessage tone="success">
            Tu correo fue verificado correctamente. Ya puedes esperar la aprobación del owner.
          </AuthMessage>
        ) : null}

        {needsSetup ? (
          <AuthMessage tone="danger">
            Ejecuta el SQL de <span className="font-semibold">supabase/schema.sql</span> en tu proyecto de Supabase para crear la tabla de perfiles y las reglas de acceso.
          </AuthMessage>
        ) : null}

        <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 shadow-[0_14px_35px_rgba(22,36,61,0.08)]">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex gap-4 rounded-[1.35rem] border border-[color:var(--line)] bg-white/80 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)] font-heading text-sm font-semibold text-[color:var(--accent-strong)]">
                  0{index + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold text-[color:var(--brand-dark)]">
                      {step.title}
                    </h2>
                    <span className="rounded-full bg-[color:var(--brand-dark)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
                      {step.status}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-white/65 p-5">
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {needsSetup
              ? "Después de ejecutar el SQL, esta vista leerá el estado real de aprobación desde Supabase."
              : isApproved
                ? "Cuando el dashboard exista, los usuarios aprobados podrán salir de esta pantalla hacia el panel principal."
                : "Mientras no exista aprobación, esta vista se mantendrá como el destino real después de verificar el correo."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-mid)]"
          >
            Volver al acceso
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-5 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
          >
            Revisar registro
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
