type ConstructionPageProps = {
  title: string;
};

export function ConstructionPage({ title }: ConstructionPageProps) {
  return (
    <section className="rounded-[2rem] border border-[#eadcd2] bg-white px-5 py-8 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
          Próximamente
        </p>
        <h1 className="mt-3 font-heading text-[2.4rem] font-bold leading-[0.96] tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[3.4rem]">
          {title}
        </h1>
        <p className="mt-4 text-base text-[color:var(--brand-mid)] sm:text-lg">
          Esta página está en construcción.
        </p>
      </div>
    </section>
  );
}
