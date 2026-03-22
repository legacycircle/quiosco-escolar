function SkeletonCard() {
  return (
    <div className="rounded-[1.6rem] border border-[#eadcd2] bg-white px-5 py-4 shadow-[0_16px_36px_rgba(22,36,61,0.06)]">
      <div className="h-4 w-28 animate-pulse rounded-full bg-[#efe3da]" />
      <div className="mt-4 h-10 w-24 animate-pulse rounded-full bg-[#f3e9e2]" />
      <div className="mt-4 h-4 w-32 animate-pulse rounded-full bg-[#f7efe9]" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-[#f1e4db] bg-white/80">
      <td className="px-4 py-2" colSpan={11}>
        <div className="h-4 animate-pulse rounded-full bg-[#f7efe9]" />
      </td>
    </tr>
  );
}

export default function Loading() {
  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="space-y-5 lg:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="h-12 w-56 animate-pulse rounded-full bg-[#eadfd7]" />
            <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-full bg-[#f1e7e0]" />
          </div>
          <div className="h-11 w-64 animate-pulse rounded-full bg-[#dde4f0]" />
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </section>
      </section>

      <section className="rounded-[2rem] border border-[#eadcd2] bg-white p-5 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:p-6 lg:rounded-[1.8rem]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-44 animate-pulse rounded-full bg-[#eadfd7]" />
          <div className="h-5 w-40 animate-pulse rounded-full bg-[#f1e7e0]" />
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[#eadcd2] bg-[#fffdfa]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1420px] border-collapse">
              <thead>
                <tr className="bg-[#f6ede7]">
                  <th className="px-4 py-2"><div className="h-4 w-20 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-14 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                  <th className="px-4 py-2"><div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-[#e1d3c8]" /></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
