export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-20 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-8 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Simple, transparent pricing
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Plans for every stage
        </h1>
        <p className="text-xl text-slate-600">
          Choose the perfect plan for your needs. Always flexible to scale up or down.
        </p>
      </div>
    </section>
  );
}
