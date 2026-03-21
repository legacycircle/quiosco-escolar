"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSiteUrl } from "@/lib/supabase/public-env";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

function buildValidationFeedback(text: string, detail?: string): Feedback {
  return {
    tone: "danger",
    title: "No se pudo crear la cuenta",
    text,
    detail,
  };
}

function formatSignupError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("user already registered")) {
    return {
      text: "Ese correo ya está registrado. Intenta iniciar sesión.",
      detail: message,
    };
  }

  if (normalized.includes("database error saving new user")) {
    return {
      text: "Supabase no pudo guardar el usuario nuevo.",
      detail: message,
    };
  }

  if (normalized.includes("redirect url") || normalized.includes("redirect_to")) {
    return {
      text: "La URL de redirección de verificación no coincide con la configuración de Supabase.",
      detail: message,
    };
  }

  return {
    text: "Supabase devolvió un error al crear la cuenta.",
    detail: message,
  };
}

export function SignupForm() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!fullName || !email) {
      setFeedback(
        buildValidationFeedback(
          "Completa los campos obligatorios.",
          "Faltan nombre o correo."
        )
      );
      return;
    }

    if (password.length < 8) {
      setFeedback(
        buildValidationFeedback(
          "La contraseña debe tener al menos 8 caracteres.",
          `Longitud actual: ${password.length}`
        )
      );
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const siteUrl = getSiteUrl();
          const supabase = createSupabaseBrowserClient();
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${siteUrl}/auth/callback`,
              data: {
                full_name: fullName,
              },
            },
          });

          if (error) {
            const parsed = formatSignupError(error.message);
            setFeedback({
              tone: "danger",
              title: "No se pudo crear la cuenta",
              text: parsed.text,
              detail: parsed.detail,
            });
            return;
          }

          const identitiesCount = data.user?.identities?.length ?? 0;

          if (!data.user || identitiesCount === 0) {
            setFeedback({
              tone: "danger",
              title: "No pudimos confirmar el alta",
              text: "Supabase no confirmó una cuenta nueva con ese correo.",
              detail:
                "Esto puede pasar si el correo ya existe o si Auth está ocultando el resultado por seguridad.",
            });
            return;
          }

          form.reset();
          setFeedback({
            tone: "success",
            title: "Cuenta creada correctamente",
            text: "Revisa tu correo y abre el enlace de verificación para continuar.",
            detail: `Redirección configurada: ${siteUrl}/auth/callback`,
          });
        } catch (error) {
          const detail =
            error instanceof Error ? error.message : "Error inesperado no identificado.";

          setFeedback({
            tone: "danger",
            title: "Falló el registro",
            text: "El sistema lanzó una excepción al intentar crear la cuenta.",
            detail,
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <label className="block space-y-2" htmlFor="fullName">
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">
            Nombre
          </span>
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
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">
            Correo
          </span>
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
          <span className="text-[1.02rem] font-medium text-[color:var(--brand-dark)]">
            Contraseña
          </span>
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
          {isPending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      {feedback ? (
        <div
          className={[
            "rounded-2xl border px-4 py-4 text-sm leading-6",
            feedback.tone === "success"
              ? "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/30 text-[color:var(--brand-dark)]"
              : "border-[color:var(--accent)]/22 bg-[color:var(--accent-soft)]/42 text-[color:var(--brand-dark)]",
          ].join(" ")}
        >
          <p className="font-semibold text-[color:var(--brand-dark)]">{feedback.title}</p>
          <p className="mt-1">{feedback.text}</p>
          {feedback.detail ? (
            <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-[color:var(--brand-mid)] break-words">
              {feedback.detail}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-center text-[1.02rem] text-[color:var(--brand-mid)]">
        Ya tienes una cuenta?{" "}
        <Link
          href="/"
          className="font-semibold text-[color:var(--brand-dark)] hover:text-[color:var(--accent)]"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
