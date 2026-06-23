export default function About({ showIntro = true }) {
  return (
    <section className="bg-slate-50 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          {showIntro ? (
            <>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">About YalaByte</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-navy-950 sm:text-4xl lg:text-5xl">
                One team to plan, build, launch, and maintain your website
              </h2>
            </>
          ) : (
            <h2 className="max-w-xl text-3xl font-semibold leading-tight text-navy-950 sm:text-4xl">The same team, from the first plan to launch day.</h2>
          )}
          <div className="mt-8 grid gap-3 min-[420px]:grid-cols-2">
            {[
              ['Clear scope', 'Pages, features, and responsibilities'],
              ['Real content', 'Layouts tested with your information'],
              ['Responsive build', 'Every screen size considered'],
              ['Clean handover', 'Access, guidance, and launch support']
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="font-semibold text-navy-950">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 text-base leading-8 text-slate-600">
            <p>
              YalaByte handles website planning, interface design, development, domain setup, hosting guidance, and ongoing improvements in one place.
            </p>
            <p>
              That means fewer handoffs, clearer decisions, and a website shaped around the information your customers actually need.
            </p>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">What you can expect</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {['Agreed deliverables', 'Regular review points', 'Support after launch'].map((item) => (
                <div key={item} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-navy-900">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
