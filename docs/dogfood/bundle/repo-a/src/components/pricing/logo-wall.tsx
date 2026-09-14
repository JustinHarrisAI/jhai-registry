export function LogoWall() {
  const logos = [
    { name: "Acme" },
    { name: "GlobalTech" },
    { name: "DataFlow" },
    { name: "CloudSync" },
    { name: "NetWave" },
    { name: "PrimeCore" },
  ];

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Trusted by leading companies
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 items-center">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-6 py-8 hover:border-slate-300 hover:bg-white transition-all"
            >
              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {logo.name[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
