import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "En espera",
};

const steps = [
  {
    title: "Cuenta creada",
    description: "Tu registro quedó preparado dentro del flujo de acceso del quiosco.",
    status: "Completado",
  },
  {
    title: "Correo verificado",
    description: "Después de confirmar tu email, la cuenta queda lista para revisión.",
    status: "Siguiente paso",
  },
  {
    title: "Aprobación manual del owner",
    description: "Solo cuando el owner autorice el acceso podrás entrar al panel principal.",
    status: "Pendiente",
  },
];

export default function WaitPage() {
  return (
    <AuthShell
      badge="Sala de espera"
      title="Tu cuenta está en revisión manual."
      description="Esta pantalla será el paso intermedio entre la verificación del email y la aprobación final del owner. Así mantenemos el acceso del quiosco bajo control."
      asideLabel="Lo que viene"
      asideTitle="Mientras el owner aprueba, ya dejamos lista la experiencia del producto."
      asideDescription="Aquí encaja muy bien el mensaje de espera porque tu sistema tendrá roles claros, una sola propiedad inicial y admins autorizados de forma manual."
      metrics={[
        { value: "2", label: "roles del sistema" },
        { value: "Manual", label: "aprobación owner" },
        { value: "100%", label: "email auth" },
      ]}
      highlights={[
        "Owner único para control inicial del negocio.",
        "Admins con acceso según aprobación.",
        "Próximo paso: conectar Supabase y reglas de autorización.",
        "Después: dashboard, productos, ventas, gastos y reportes.",
      ]}
    >
      <div className="space-y-6">
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
            Cuando conectemos Supabase, esta vista será el destino real después
            de verificar el correo.
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
