export default function PageHero({ eyebrow, title, text, actions }) {
  return (
    <section className="overflow-hidden bg-navy-950 px-5 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="motion-soft mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyanbrand-400">{eyebrow}</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.65fr)] lg:items-end lg:gap-16">
          <h1 className="max-w-4xl text-[clamp(2.6rem,5.2vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-balance">{title}</h1>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-8 text-slate-300 sm:text-lg">{text}</p>
            {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
