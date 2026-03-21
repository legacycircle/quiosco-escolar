import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata: Metadata = {
  title: "Acceso",
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--muted)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.96),_rgba(208,211,216,0.9)_44%,_rgba(22,36,61,0.78)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[72px]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <section className="w-full max-w-[446px] rounded-[22px] border border-white/60 bg-[rgba(255,255,255,0.94)] px-8 py-10 shadow-[0_22px_60px_rgba(22,36,61,0.18)]">
          <div className="mb-8 text-center">
            <h1 className="font-logo text-[3.5rem] leading-none tracking-[0.08em] text-[color:var(--brand-dark)] sm:text-[4rem]">
              QUIOSCO
            </h1>
            <p className="mt-2 text-[0.98rem] text-[color:var(--brand-mid)]">
              Plataforma de gestión y métricas
            </p>
          </div>

          <LoginPanel />
        </section>
      </div>
    </main>
  );
}
