import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

const notes = [
  { icon: "+", text: "Registro centralizado por correo para nuevos admins." },
  { icon: "~", text: "Flujo de verificación de correo para activar acceso." },
  { icon: "o", text: "El owner se define una sola vez desde Supabase." },
];

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
        <section className="hidden bg-[color:var(--brand-dark)] text-white lg:flex">
          <div className="mx-auto flex w-full max-w-3xl flex-col justify-center px-20 py-20">
            <div className="max-w-[34rem] space-y-12">
              <div className="space-y-10">
                <h1 className="font-logo text-[4.4rem] leading-none tracking-[0.1em] text-white">
                  QUIOSCO
                </h1>
                <p className="max-w-[32rem] text-[1.12rem] leading-[1.95] text-white/96">
                  Gestiona inventario, productos, clientes, ventas y gastos en una sola plataforma.
                </p>
              </div>

              <div className="space-y-8">
                {notes.map((note) => (
                  <div key={note.text} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-semibold text-white/90">
                      {note.icon}
                    </div>
                    <p className="text-[1.04rem] leading-8 text-white/96">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-14 sm:px-10 lg:px-12">
          <div className="w-full max-w-[36rem]">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-[4rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[4.7rem]">
                Crea tu cuenta
              </h2>
              <p className="mt-4 text-[1.12rem] text-[color:var(--brand-mid)]">
                Completa tus datos para continuar.
              </p>
            </div>

            <SignupForm />
          </div>
        </section>
      </div>
    </main>
  );
}
