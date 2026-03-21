"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AuthMessage } from "@/components/auth/auth-form-primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function formatAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Necesitas verificar tu correo antes de continuar.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contraseña inválidos.";
  }

  return message;
}

type LoginPanelProps = {
  initialError?: string;
};

export function LoginPanel({ initialError }: LoginPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{
    text: string;
    tone: "danger" | "success";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(() => {
      setMessage(null);

      void (async () => {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({
            text: formatAuthError(error.message),
            tone: "danger",
          });
          return;
        }

        router.replace("/wait");
        router.refresh();
      })();
    });
  };

  const activeMessage =
    message ??
    (initialError
      ? {
          text: initialError,
          tone: "danger" as const,
        }
      : null);

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
          {isPending ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      {activeMessage ? (
        <AuthMessage tone={activeMessage.tone}>{activeMessage.text}</AuthMessage>
      ) : null}

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
