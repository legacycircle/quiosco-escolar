"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { AuthMessage } from "@/components/auth/auth-form-primitives";

export function LoginPanel() {
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
    <div className="space-y-5">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2" htmlFor="email">
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">
            Usuario
          </span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="correo@empresa.com"
            autoComplete="email"
            required
            className="h-11 w-full rounded-xl border border-[color:var(--muted)] bg-white px-4 text-[0.98rem] text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
          />
        </label>

        <label className="block space-y-2" htmlFor="password">
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">
            Contraseña
          </span>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Escribe tu contraseña"
            autoComplete="current-password"
            required
            className="h-11 w-full rounded-xl border border-[color:var(--muted)] bg-white px-4 text-[0.98rem] text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[color:var(--brand-dark)] px-5 text-[1rem] font-semibold text-white transition hover:bg-[color:var(--brand-mid)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Preparando acceso..." : "Iniciar sesión"}
        </button>
      </form>

      {message ? <AuthMessage tone="neutral">{message}</AuthMessage> : null}

      <div className="flex items-center justify-between gap-4 pt-1 text-[0.95rem] text-[color:var(--brand-dark)]">
        <a
          href="#"
          className="transition hover:text-[color:var(--accent)]"
          onClick={(event) => event.preventDefault()}
        >
          Olvidé mi contraseña
        </a>
        <Link href="/signup" className="transition hover:text-[color:var(--accent)]">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
