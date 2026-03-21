"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { AuthField, AuthMessage } from "@/components/auth/auth-form-primitives";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    startTransition(() => {
      setMessage(
        `El frontend ya está listo. Cuando me compartas la URL y la anon key de Supabase, conecto el acceso para ${email || "tu cuenta"} con email y contraseña.`
      );
    });
  };

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Correo"
          placeholder="admin@quiosco.com"
          autoComplete="email"
          required
        />
        <AuthField
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Home = login. El acceso real quedará conectado con Supabase.
          </p>
          <Link
            href="/wait"
            className="text-sm font-semibold text-[color:var(--accent-strong)] transition hover:text-[color:var(--accent)]"
          >
            Ver /wait
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Preparando acceso..." : "Entrar al sistema"}
        </button>
      </form>

      {message ? <AuthMessage tone="neutral">{message}</AuthMessage> : null}

      <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/75 p-5">
        <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
          ¿Aún no tienes cuenta? Crea tu acceso, verifica tu email y luego pasa
          a espera de aprobación del owner.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line)] px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white"
        >
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
