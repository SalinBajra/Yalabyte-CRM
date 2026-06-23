import SectionHeader from './SectionHeader.jsx';
import { services } from '../data/siteData.js';

export default function Services({ showIntro = true }) {
  return (
    <section className={`bg-[#141618] px-5 text-white sm:px-6 lg:px-8 ${showIntro ? 'py-24' : 'py-16 sm:py-20 lg:py-24'}`}>
      <div className="mx-auto max-w-7xl">
        {showIntro ? (
          <SectionHeader
            light
            eyebrow="Services"
            title="Website work, scoped around the actual job"
            text="Start with a new company website, improve an existing one, or add the custom tools your team needs."
          />
        ) : null}
        <div className={`${showIntro ? 'mt-14' : ''} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
          {services.map((service, index) => (
            <article key={service.title} className={`motion-soft group rounded-lg border p-6 transition hover:-translate-y-1 hover:shadow-soft ${index === 0 ? 'border-cyanbrand-500 bg-cyanbrand-500 text-navy-950 lg:row-span-2' : 'border-white/10 bg-white/[0.04] text-white'}`} style={{ animationDelay: `${index * 45}ms` }}>
              <div className="mb-8 flex items-center justify-between">
                <span className={`text-sm font-bold ${index === 0 ? 'text-navy-950' : 'text-cyanbrand-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                <span className={`h-px w-16 ${index === 0 ? 'bg-navy-950/20' : 'bg-white/10'}`} />
              </div>
              <h3 className={`text-xl font-semibold ${index === 0 ? 'text-navy-950' : 'text-white'}`}>{service.title}</h3>
              <p className={`mt-4 text-sm leading-7 ${index === 0 ? 'text-navy-900' : 'text-slate-300'}`}>{service.text}</p>
              <div className={`mt-6 rounded-lg px-4 py-3 text-sm font-semibold ${index === 0 ? 'bg-navy-950 text-white' : 'bg-white/[0.08] text-cyanbrand-100'}`}>
                {service.outcome}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
