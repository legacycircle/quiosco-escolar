import type { InputHTMLAttributes, ReactNode } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function AuthField({ label, hint, id, ...props }: AuthFieldProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">{label}</span>
      <input
        id={id}
        className="min-h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
        {...props}
      />
      {hint ? (
        <span className="block text-xs leading-5 text-[color:var(--brand-mid)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

type AuthMessageProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger";
};

export function AuthMessage({
  children,
  tone = "neutral",
}: AuthMessageProps) {
  const toneClasses = {
    neutral:
      "border-[color:var(--line)] bg-white text-[color:var(--brand-mid)]",
    success:
      "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/35 text-[color:var(--accent)]",
    danger:
      "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/35 text-[color:var(--accent)]",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
