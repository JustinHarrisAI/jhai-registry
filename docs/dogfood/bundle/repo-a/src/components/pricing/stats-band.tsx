export function StatsBand() {
  const stats = [
    {
      number: "10M+",
      label: "Users worldwide",
    },
    {
      number: "99.9%",
      label: "Uptime SLA",
    },
    {
      number: "24/7",
      label: "Customer support",
    },
    {
      number: "150+",
      label: "Integrations",
    },
  ];

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-32 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-bold text-white sm:text-5xl">
                {stat.number}
              </div>
              <p className="mt-2 text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-slate-700 bg-slate-800/50 px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Join thousands of teams already using our platform.
          </p>
          <button className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
            Start your free trial
          </button>
        </div>
      </div>
    </section>
  );
}
