import Link from "next/link";

type BrandMarkProps = {
  href?: string;
};

export function BrandMark({ href = "/" }: BrandMarkProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand-dark)] text-sm font-black uppercase tracking-[0.24em] text-white shadow-[0_14px_32px_rgba(22,36,61,0.2)]">
        Q
      </div>
      <div className="space-y-1">
        <p className="font-logo text-xl font-bold uppercase tracking-[0.24em] text-[color:var(--brand-dark)]">
          QUIOSCO
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--brand-mid)]">
          Control escolar
        </p>
      </div>
    </Link>
  );
}
