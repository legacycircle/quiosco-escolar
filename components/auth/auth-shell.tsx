import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type Metric = {
  value: string;
  label: string;
};

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  asideLabel: string;
  asideTitle: string;
  asideDescription: string;
  metrics: Metric[];
  highlights: string[];
  children: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  asideLabel,
  asideTitle,
  asideDescription,
  metrics,
  highlights,
  children,
}: AuthShellProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(54,74,111,0.12),_transparent_58%)]" />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(209,7,84,0.1),_transparent_64%)] lg:block" />

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(246,205,221,0.22))] p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-[color:var(--accent-soft)] blur-3xl" />
          <div className="absolute bottom-6 right-6 h-32 w-32 rounded-full bg-[color:var(--muted)]/60 blur-3xl" />

          <div className="relative flex h-full flex-col gap-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <BrandMark />
              <div className="inline-flex w-fit rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {asideLabel}
              </div>
            </div>

            <div className="max-w-2xl space-y-4">
              <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight text-[color:var(--brand-dark)] sm:text-5xl">
                {asideTitle}
              </h1>
              <p className="max-w-xl text-base leading-8 text-[color:var(--ink-soft)] sm:text-lg">
                {asideDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.value + metric.label}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/85 p-4 shadow-[0_10px_35px_rgba(22,36,61,0.08)]"
                >
                  <p className="font-heading text-2xl font-semibold text-[color:var(--brand-dark)]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.75rem] bg-[color:var(--brand-dark)] p-5 text-white shadow-[0_18px_40px_rgba(22,36,61,0.24)]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                    Vista previa
                  </p>
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.35rem] bg-white/8 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/65">Ganancia estimada</p>
                        <p className="mt-2 font-heading text-3xl font-semibold">
                          +24%
                        </p>
                      </div>
                      <div className="rounded-full bg-[color:var(--accent)]/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-soft)]">
                        semanal
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[38, 64, 51].map((height, index) => (
                      <div
                        key={height}
                        className="flex items-end rounded-[1.15rem] bg-white/8 p-3"
                      >
                        <div
                          className="w-full rounded-full bg-[linear-gradient(180deg,#d10754_0%,#364a6f_100%)]"
                          style={{ height }}
                        />
                        <span className="sr-only">Indicador {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/75 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                  Qué controlará el sistema
                </p>
                <div className="mt-4 space-y-3">
                  {highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex gap-3 rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3"
                    >
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                      <p className="text-sm leading-6 text-[color:var(--brand-dark)]">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
            <div className="space-y-3">
              <div className="inline-flex w-fit rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
                {badge}
              </div>
              <h2 className="font-heading text-3xl font-bold leading-tight text-[color:var(--brand-dark)] sm:text-[2.4rem]">
                {title}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--ink-soft)] sm:text-base">
                {description}
              </p>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
