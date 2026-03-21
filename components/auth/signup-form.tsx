"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AuthMessage } from "@/components/auth/auth-form-primitives";

type Tone = "danger";

export function SignupForm() {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!fullName || !email) {
      setMessage({
        text: "Completa los campos obligatorios.",
        tone: "danger",
      });
      return;
    }

    if (password.length < 8) {
      setMessage({
        text: "La contraseña debe tener al menos 8 caracteres.",
        tone: "danger",
      });
      return;
    }

    startTransition(() => {
      setMessage(null);
      router.push("/wait");
    });
  };

  return (
    <div className="space-y-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <label className="block space-y-2" htmlFor="fullName">
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">Nombre</span>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Tu nombre completo"
            autoComplete="name"
            required
            className="h-12 w-full rounded-xl border border-[color:var(--muted)] bg-white px-4 text-[1rem] text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
          />
        </label>

        <label className="block space-y-2" htmlFor="email">
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">Correo</span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="correo@empresa.com"
            autoComplete="email"
            required
            className="h-12 w-full rounded-xl border border-[color:var(--muted)] bg-white px-4 text-[1rem] text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
          />
        </label>

        <label className="block space-y-2" htmlFor="password">
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">Contraseña</span>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Crea una contraseña"
            autoComplete="new-password"
            required
            className="h-12 w-full rounded-xl border border-[color:var(--muted)] bg-white px-4 text-[1rem] text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
          />
          <p className="text-sm text-[color:var(--brand-mid)]">Mínimo 8 caracteres.</p>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--brand-dark)] px-5 text-[1.08rem] font-semibold text-white transition hover:bg-[color:var(--brand-mid)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      {message ? <AuthMessage tone={message.tone}>{message.text}</AuthMessage> : null}

      <p className="text-center text-[1.02rem] text-[color:var(--brand-mid)]">
        Ya tienes una cuenta? {" "}
        <Link href="/" className="font-semibold text-[color:var(--brand-dark)] hover:text-[color:var(--accent)]">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
