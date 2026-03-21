"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SignOutButtonProps = {
  fullWidth?: boolean;
};

export function SignOutButton({ fullWidth = false }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    startTransition(() => {
      setError(null);

      void (async () => {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          setError("No pudimos cerrar la sesión. Intenta de nuevo.");
          return;
        }

        router.replace("/");
        router.refresh();
      })();
    });
  };

  return (
    <div
      className={[
        "flex flex-col gap-2",
        fullWidth ? "items-stretch" : "items-stretch sm:items-end",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className={[
          "inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70",
          fullWidth ? "w-full" : "",
        ].join(" ")}
      >
        Cerrar sesión
      </button>
      {error ? (
        <p
          className={[
            "text-xs leading-5 text-[color:var(--accent)]",
            fullWidth ? "text-left" : "text-center sm:text-right",
          ].join(" ")}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
